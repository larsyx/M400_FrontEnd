import { Component, Input, OnInit } from '@angular/core';
import { SlidersContainer } from '../../../../shared/sliders/sliders-container/sliders-container/sliders-container';
import { Fader } from '../../../../core/models/fader.model';
import { MixerService } from '../../../../core/services/mixer.service';

@Component({
  selector: 'app-dca',
  imports: [SlidersContainer],
  standalone: true,
  templateUrl: './dca.html',
  styleUrl: './dca.scss',
})
export class Dca implements OnInit {

  @Input() dca: Fader[] = [];

  constructor(private mixerService: MixerService){}

  ngOnInit(): void {
    if(this.dca.length==0){
      this.mixerService.loadDca().subscribe({
        next: (res) => {
          this.dca = res;
        }
      });
    }
  }
}
