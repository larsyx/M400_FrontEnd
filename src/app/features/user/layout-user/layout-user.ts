import { Component, effect, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { Fader, TypeChannel } from '../../../core/models/fader.model';
import { ChannelLayout } from '../../../core/models/channel.layout.model';

type LayoutStep = 'home' | 'channels' | 'order' | 'categories';


@Component({
  selector: 'app-layout-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout-user.html',
  styleUrl: './layout-user.scss'
})
export class LayoutUserComponent {
  selectedSceneName = '';
  sceneId: number | null = null;

  currentStep = signal<LayoutStep>('home');

  channelSelections: ChannelLayout[] = [];

  // Drag & drop (desktop)
  draggedIndex: number | null = null;
  dragOverIndex: number | null = null;

  // Touch drag state
  isTouchDrag = false;
  touchDragOffsetX = 0;
  touchDragOffsetY = 0;
  private touchStartClientX = 0;
  private touchStartClientY = 0;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private autoScrollFrame: number | null = null;
  private autoScrollSpeed = 0;

  // Tap-to-swap (mobile-friendly)
  swapSourceIndex: number | null = null;

  categories = [
    { id: TypeChannel.INSTRUMENT, label: 'Strumenti', icon: '🎸', color: '#3b82f6' },
    { id: TypeChannel.VOICE, label: 'Voci', icon: '🎤', color: '#8b5cf6' },
    { id: TypeChannel.DRUM, label: 'Batteria', icon: '🥁', color: '#ef4444' }
  ];

  constructor(private userService: UserService, private el: ElementRef<HTMLElement>) {
    effect(() => {
      this.selectedSceneName = this.userService.currentSceneName();
      const id = this.userService.currentSceneId();
      if (id !== this.sceneId) {
        this.sceneId = id;
        if (id !== null) {
          this.loadSceneData();
        }
      }
    });
  }

  private loadSceneData(): void {
    this.userService.loadChannelLayout(this.sceneId!).subscribe({
      next: (res) => {
        this.channelSelections = res;
      },
      error: (err) => {
        console.error('Errore nel caricamento dei dati:', err);
      }
    });
  }

  // ===== Navigation =====
  goToStep(step: LayoutStep): void {
    if (step === 'channels') {
      this.currentStep.set(step);
    } else if (step === 'order' && this.canProceedFromChannels()) {
      this.currentStep.set(step);
    } else if (step === 'categories' && this.canProceedFromOrder()) {
      this.currentStep.set(step);
    }
    this.cancelSwap();
  }

  goToHome(): void {
    this.currentStep.set('home');
    this.cancelSwap();
  }

  goToNextStep(): void {
    const current = this.currentStep();
    if (current === 'channels' && this.canProceedFromChannels()) {
      this.currentStep.set('order');
    } else if (current === 'order' && this.canProceedFromOrder()) {
      this.currentStep.set('categories');
    }
    this.cancelSwap();
  }

  goToPreviousStep(): void {
    const current = this.currentStep();
    if (current === 'categories') {
      this.currentStep.set('order');
    } else if (current === 'order') {
      this.currentStep.set('channels');
    } else if (current === 'channels') {
      this.currentStep.set('home');
    }
    this.cancelSwap();
  }

  // ===== Step 1: Channel selection =====
  toggleChannelSelection(index: number): void {
    this.channelSelections[index].selected = !this.channelSelections[index].selected;
  }

  selectAllChannels(): void {
    this.channelSelections.forEach(cs => cs.selected = true);
  }

  deselectAllChannels(): void {
    this.channelSelections.forEach(cs => cs.selected = false);
  }

  getSelectedChannels(): ChannelLayout[] {
    return this.channelSelections.filter(cs => cs.selected)
              .sort((a,b) => a.position - b.position);
  }

  getSelectedCount(): number {
    return this.channelSelections.filter(cs => cs.selected).length;
  }

  // ===== Step 2: Reorder =====
  // Tap-to-swap: tap one item, then tap another to swap their positions
  handleItemTap(index: number): void {
    if (this.swapSourceIndex === null) {
      this.swapSourceIndex = index;
      return;
    }
    if (this.swapSourceIndex === index) {
      this.swapSourceIndex = null;
      return;
    }
    const a = this.swapSourceIndex;
    const b = index;
    this.animateReorder(() => {
      const selectedChannels = this.getSelectedChannels();
      const channelA = selectedChannels[a];
      const channelB = selectedChannels[b];
      // Swap positions
      [channelA.position, channelB.position] = [channelB.position, channelA.position];
      this.swapSourceIndex = null;
    });
  }

  // FLIP-style animation: capture each card's position, mutate the array,
  // then animate from old to new position (works for 2D grid).
  private animateReorder(mutate: () => void): void {
    const list = this.el.nativeElement.querySelector('.order-grid') as HTMLElement | null;
    if (!list) {
      mutate();
      return;
    }
    const firstRects = new Map<string, DOMRect>();
    list.querySelectorAll<HTMLElement>('.order-card').forEach(node => {
      const id = node.getAttribute('data-channel-id');
      if (id !== null) firstRects.set(id, node.getBoundingClientRect());
    });

    mutate();

    requestAnimationFrame(() => {
      const items = list.querySelectorAll<HTMLElement>('.order-card');
      items.forEach(node => {
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
        // Force reflow so the browser registers the start state
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

  cancelSwap(): void {
    this.swapSourceIndex = null;
  }

  // ===== Drag & Drop (desktop, HTML5 native) =====
  onDragStart(event: DragEvent, index: number): void {
    this.cancelSwap();
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', index.toString());
    }
  }

  onDragEnd(_event: DragEvent): void {
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverIndex = index;
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
      const fromIdx = this.draggedIndex;
      this.animateReorder(() => {
        const selectedChannels = this.getSelectedChannels();
        const draggedChannel = selectedChannels[fromIdx];
        const targetChannel = selectedChannels[dropIndex];
        
        // Reorder positions: move dragged item to target position
        const draggedPos = draggedChannel.position;
        const targetPos = targetChannel.position;
        
        if (draggedPos < targetPos) {
          // Moving down: shift items up
          this.channelSelections.forEach(ch => {
            if (ch.selected && ch.position > draggedPos && ch.position <= targetPos) {
              ch.position--;
            }
          });
        } else {
          // Moving up: shift items down
          this.channelSelections.forEach(ch => {
            if (ch.selected && ch.position >= targetPos && ch.position < draggedPos) {
              ch.position++;
            }
          });
        }
        draggedChannel.position = targetPos;
      });
    }
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  // ===== Touch Drag (mobile) — uses elementFromPoint to track target =====
  onTouchStart(event: TouchEvent, index: number): void {
    event.stopPropagation();
    this.cancelSwap();
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

  onTouchEnd(_event: TouchEvent): void {
    if (
      this.draggedIndex !== null &&
      this.dragOverIndex !== null &&
      this.draggedIndex !== this.dragOverIndex
    ) {
      const from = this.draggedIndex;
      const to = this.dragOverIndex;
      // Reset transform/state BEFORE animateReorder so FLIP measures the
      // dragged item from its current visual position to its new natural one.
      this.resetTouchDrag();
      this.animateReorder(() => {
        const selectedChannels = this.getSelectedChannels();
        const draggedChannel = selectedChannels[from];
        const targetChannel = selectedChannels[to];
        
        // Reorder positions: move dragged item to target position
        const draggedPos = draggedChannel.position;
        const targetPos = targetChannel.position;
        
        if (draggedPos < targetPos) {
          // Moving down: shift items up
          this.channelSelections.forEach(ch => {
            if (ch.selected && ch.position > draggedPos && ch.position <= targetPos) {
              ch.position--;
            }
          });
        } else {
          // Moving up: shift items down
          this.channelSelections.forEach(ch => {
            if (ch.selected && ch.position >= targetPos && ch.position < draggedPos) {
              ch.position++;
            }
          });
        }
        draggedChannel.position = targetPos;
      });
      return;
    }
    this.resetTouchDrag();
  }

  onTouchCancel(_event: TouchEvent): void {
    this.resetTouchDrag();
  }

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
    const orderItem = elBelow?.closest('.order-card') as HTMLElement | null;
    if (!orderItem) return;
    const attr = orderItem.getAttribute('data-index');
    if (attr === null) return;
    const idx = parseInt(attr, 10);
    if (!Number.isNaN(idx)) {
      this.dragOverIndex = idx;
    }
  }

  // ===== Auto-scroll while dragging near edges =====
  private updateAutoScroll(touchClientY: number): void {
    const list = this.el.nativeElement.querySelector('.order-grid') as HTMLElement | null;
    if (!list) {
      this.autoScrollSpeed = 0;
      return;
    }
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
        const l = this.el.nativeElement.querySelector('.order-grid') as HTMLElement | null;
        if (l) {
          const before = l.scrollTop;
          l.scrollTop += this.autoScrollSpeed;
          const actualDelta = l.scrollTop - before;
          if (actualDelta !== 0) {
            // Compensate so the dragged item stays under the finger
            this.touchStartClientY -= actualDelta;
            this.touchDragOffsetY = this.lastTouchY - this.touchStartClientY;
            // Re-evaluate the target slot since items moved relative to the touch
            this.updateDragOverFromPoint(this.lastTouchX, this.lastTouchY);
          } else {
            // Reached scroll boundary — stop accelerating
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

  // ===== Step 3: Categories =====
  assignCategory(channel: ChannelLayout, categoryId: TypeChannel): void {
    channel.type = categoryId;
  }

  clearCategory(channel: ChannelLayout): void {
    channel.type = null;
  }

  getCategoryForChannel(channel: Fader): any {
    return this.categories.find(c => c.id === channel.type);
  }

  getCategorizedCount(): number {
    return this.channelSelections.filter(c => c.type !== null).length;
  }

  applyDefaultLayout(): void {
    this.userService.storeDefaultChannelLayout(this.sceneId!).subscribe({
      next: (res) => {
        this.channelSelections = res;
      },
      error: (err) => {
        console.error('Errore nel recupero del layout predefinito:', err);
      }
    });
  }

  saveLayout(): void {
    const selectedChannels = this.channelSelections
      .filter(ch => ch.selected)
      .sort((a, b) => a.position - b.position);
    
    selectedChannels.forEach((ch, index) => {
      ch.position = index;
    });
    
    this.userService.storeChannelLayout(this.sceneId!, selectedChannels).subscribe({
      next: () => {
        this.goToHome();
      },
      error: (err) => {
        console.error('Errore nel salvataggio:', err);
        alert('Errore nel salvataggio del layout');
      }
    });
  }

  // ===== Helpers =====
  canProceedFromChannels(): boolean {
    return this.getSelectedCount() > 0;
  }

  canProceedFromOrder(): boolean {
    return this.channelSelections.length > 0;
  }

  canSaveLayout(): boolean {
    return this.channelSelections.length > 0;
  }
}
