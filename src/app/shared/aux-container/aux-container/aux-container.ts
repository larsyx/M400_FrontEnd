import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { MixerService } from '../../../core/services/mixer.service';
import { IAuxs } from '../../../core/models/auxs.model';

@Component({
  selector: 'app-aux-container',
  imports: [],
  templateUrl: './aux-container.html',
  styleUrl: './aux-container.scss',
})
export class AuxContainer{
  @Input() auxs: IAuxs[] = [];
  @Output() selectionChange = new EventEmitter<number>();

  selectedIndex: number = -1;

  select(index: number) {
    this.selectedIndex = index;
    this.selectionChange.emit(index);
  }

}
