import { Component, ElementRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { UserService } from '../../../core/services/user.service';
import { AdminChannel } from '../../../core/models/admin.channel.model';
import { Channel } from '../../../core/models/channel.model';

@Component({
    selector: 'app-mixer-channels',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './channels-mixer.html',
    styleUrl: '../../admin/channels/channels-admin.scss'
})
export class MixerChannelsComponent implements OnInit {
    channels: AdminChannel[] = [];
    saved = signal(false);

    draggedIndex: number | null = null;
    dragOverIndex: number | null = null;

    isTouchDrag = false;
    touchDragOffsetX = 0;
    touchDragOffsetY = 0;
    private touchStartClientX = 0;
    private touchStartClientY = 0;
    private lastTouchX = 0;
    private lastTouchY = 0;
    private autoScrollFrame: number | null = null;
    private autoScrollSpeed = 0;

    constructor(
        private adminService: AdminService,
        private userService: UserService,
        private el: ElementRef<HTMLElement>
    ) {}

    ngOnInit(): void {
        this.loadChannels();
    }

    private loadChannels(): void {
        this.adminService.listChannels().subscribe({
            next: (res) => {
                this.channels = [...res].sort((a, b) => a.position - b.position);
                this.normalizePositions();
                this.loadMixerNames();
            },
            error: (err) => console.error('Errore caricamento canali:', err)
        });
    }

    private loadMixerNames(): void {
        this.userService.loadFaderNames().subscribe({
            next: (faders) => {
                this.channels.forEach(c => {
                    const f = faders.find(x => x.id === c.id);
                    if (f) c.mixerDescription = f.description;
                });
            },
            error: (err) => console.error('Errore caricamento nomi mixer:', err)
        });
    }

    private normalizePositions(): void {
        this.channels
            .sort((a, b) => a.position - b.position)
            .forEach((ch, idx) => ch.position = idx);
    }

    // ===== Selection =====
    toggleSelection(channel: AdminChannel, event?: Event): void {
        event?.stopPropagation();
        channel.selected = !channel.selected;
    }

    selectAll(): void { this.channels.forEach(c => c.selected = true); }
    deselectAll(): void { this.channels.forEach(c => c.selected = false); }

    getSelectedCount(): number {
        return this.channels.filter(c => c.selected).length;
    }

    // ===== Drag & drop =====
    onDragStart(event: DragEvent, index: number): void {
        this.draggedIndex = index;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/html', index.toString());
        }
    }

    onDragEnd(): void {
        this.draggedIndex = null;
        this.dragOverIndex = null;
    }

    onDragOver(event: DragEvent, index: number): void {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        this.dragOverIndex = index;
    }

    onDrop(event: DragEvent, dropIndex: number): void {
        event.preventDefault();
        if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
            const fromIdx = this.draggedIndex;
            this.animateReorder(() => this.movePosition(fromIdx, dropIndex));
        }
        this.draggedIndex = null;
        this.dragOverIndex = null;
    }

    private movePosition(fromIdx: number, toIdx: number): void {
        const ordered = [...this.channels].sort((a, b) => a.position - b.position);
        const [moved] = ordered.splice(fromIdx, 1);
        ordered.splice(toIdx, 0, moved);
        ordered.forEach((ch, idx) => ch.position = idx);
    }

    // ===== Touch drag =====
    onTouchStart(event: TouchEvent, index: number): void {
        event.stopPropagation();
        const touch = event.touches[0];
        if (!touch) return;
        this.draggedIndex = index;
        this.dragOverIndex = index;
        this.isTouchDrag = true;
        this.touchStartClientX = touch.clientX;
        this.touchStartClientY = touch.clientY;
        this.touchDragOffsetX = 0;
        this.touchDragOffsetY = 0;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
    }

    onTouchMove(event: TouchEvent): void {
        if (this.draggedIndex === null) return;
        event.preventDefault();
        const touch = event.touches[0];
        if (!touch) return;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
        this.touchDragOffsetX = touch.clientX - this.touchStartClientX;
        this.touchDragOffsetY = touch.clientY - this.touchStartClientY;
        this.updateDragOverFromPoint(touch.clientX, touch.clientY);
        this.updateAutoScroll(touch.clientY);
    }

    onTouchEnd(): void {
        if (
            this.draggedIndex !== null &&
            this.dragOverIndex !== null &&
            this.draggedIndex !== this.dragOverIndex
        ) {
            const from = this.draggedIndex;
            const to = this.dragOverIndex;
            this.resetTouchDrag();
            this.animateReorder(() => this.movePosition(from, to));
            return;
        }
        this.resetTouchDrag();
    }

    onTouchCancel(): void { this.resetTouchDrag(); }

    private resetTouchDrag(): void {
        this.draggedIndex = null;
        this.dragOverIndex = null;
        this.isTouchDrag = false;
        this.touchDragOffsetX = 0;
        this.touchDragOffsetY = 0;
        this.touchStartClientX = 0;
        this.touchStartClientY = 0;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.stopAutoScroll();
    }

    private updateDragOverFromPoint(x: number, y: number): void {
        const elBelow = document.elementFromPoint(x, y);
        const row = elBelow?.closest('.channel-row') as HTMLElement | null;
        if (!row) return;
        const attr = row.getAttribute('data-index');
        if (attr === null) return;
        const idx = parseInt(attr, 10);
        if (!Number.isNaN(idx)) this.dragOverIndex = idx;
    }

    private updateAutoScroll(touchClientY: number): void {
        const list = this.el.nativeElement.querySelector('.channels-list') as HTMLElement | null;
        if (!list) { this.autoScrollSpeed = 0; return; }
        const rect = list.getBoundingClientRect();
        const edge = 70;
        const maxSpeed = 16;
        if (touchClientY < rect.top + edge) {
            const dist = Math.min(edge, (rect.top + edge) - touchClientY);
            this.autoScrollSpeed = -(dist / edge) * maxSpeed;
        } else if (touchClientY > rect.bottom - edge) {
            const dist = Math.min(edge, touchClientY - (rect.bottom - edge));
            this.autoScrollSpeed = (dist / edge) * maxSpeed;
        } else {
            this.autoScrollSpeed = 0;
        }

        if (this.autoScrollSpeed !== 0 && this.autoScrollFrame === null) {
            const tick = () => {
                if (!this.isTouchDrag || this.autoScrollSpeed === 0) {
                    this.autoScrollFrame = null;
                    return;
                }
                const l = this.el.nativeElement.querySelector('.channels-list') as HTMLElement | null;
                if (l) {
                    const before = l.scrollTop;
                    l.scrollTop += this.autoScrollSpeed;
                    const actualDelta = l.scrollTop - before;
                    if (actualDelta !== 0) {
                        this.touchStartClientY -= actualDelta;
                        this.touchDragOffsetY = this.lastTouchY - this.touchStartClientY;
                        this.updateDragOverFromPoint(this.lastTouchX, this.lastTouchY);
                    } else {
                        this.autoScrollSpeed = 0;
                    }
                }
                this.autoScrollFrame = requestAnimationFrame(tick);
            };
            this.autoScrollFrame = requestAnimationFrame(tick);
        }
    }

    private stopAutoScroll(): void {
        this.autoScrollSpeed = 0;
        if (this.autoScrollFrame !== null) {
            cancelAnimationFrame(this.autoScrollFrame);
            this.autoScrollFrame = null;
        }
    }

    // ===== FLIP animation =====
    private animateReorder(mutate: () => void): void {
        const list = this.el.nativeElement.querySelector('.channels-list') as HTMLElement | null;
        if (!list) { mutate(); return; }
        const firstRects = new Map<string, DOMRect>();
        list.querySelectorAll<HTMLElement>('.channel-row').forEach(node => {
            const id = node.getAttribute('data-channel-id');
            if (id !== null) firstRects.set(id, node.getBoundingClientRect());
        });

        mutate();

        requestAnimationFrame(() => {
            list.querySelectorAll<HTMLElement>('.channel-row').forEach(node => {
                const id = node.getAttribute('data-channel-id');
                if (id === null) return;
                const first = firstRects.get(id);
                if (!first) return;
                const last = node.getBoundingClientRect();
                const dx = first.left - last.left;
                const dy = first.top - last.top;
                if (dx === 0 && dy === 0) return;

                node.style.transition = 'none';
                node.style.transform = `translate(${dx}px, ${dy}px)`;
                void node.offsetHeight;

                requestAnimationFrame(() => {
                    node.style.transition = 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)';
                    node.style.transform = '';
                    const cleanup = (ev: TransitionEvent) => {
                        if (ev.propertyName !== 'transform') return;
                        node.style.transition = '';
                        node.style.transform = '';
                        node.removeEventListener('transitionend', cleanup);
                    };
                    node.addEventListener('transitionend', cleanup);
                });
            });
        });
    }

    // ===== Helpers =====
    getOrderedChannels(): AdminChannel[] {
        return [...this.channels].sort((a, b) => a.position - b.position);
    }

    save(): void {
        this.normalizePositions();
        let nextPos = 0;
        const payload: Channel[] = this.getOrderedChannels().map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            type: c.type,
            position: c.selected ? nextPos++ : null
        }));
        this.adminService.saveChannels(payload).subscribe({
            next: () => {
                this.saved.set(true);
                setTimeout(() => this.saved.set(false), 2200);
            },
            error: (err) => console.error('Errore salvataggio canali:', err)
        });
    }
}
