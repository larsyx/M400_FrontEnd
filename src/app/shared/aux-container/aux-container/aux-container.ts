import { Component } from '@angular/core';

@Component({
  selector: 'app-aux-container',
  imports: [],
  templateUrl: './aux-container.html',
  styleUrl: './aux-container.scss',
})
export class AuxContainer {

  auxs = [
    {
      id : 1,
      name : "aux-1"
    },
    {
      id : 2,
      name : "aux-2"
    },
    {
      id : 3,
      name : "aux-3"
    },
    {
      id : 4,
      name : "aux-4"
    },
        {
      id : 1,
      name : "aux-1"
    },
    {
      id : 2,
      name : "aux-2"
    },
    {
      id : 3,
      name : "aux-3"
    },
    {
      id : 4,
      name : "aux-4"
    },
        {
      id : 1,
      name : "aux-1"
    },
    {
      id : 2,
      name : "aux-2"
    },
    {
      id : 3,
      name : "aux-3"
    },
    {
      id : 4,
      name : "aux-4"
    },
        {
      id : 1,
      name : "aux-1"
    },
    {
      id : 2,
      name : "aux-2"
    },
    {
      id : 3,
      name : "aux-3"
    },
    {
      id : 4,
      name : "aux-4"
    }
  ];

  
  selectedIndex: number = -1;

  select(index: number) {
    this.selectedIndex = index;
  }

}
