import { Component } from "@angular/core";
import { Header } from "./header/header";
import { Footer } from "./footer/footer";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: 'app-layout',
    templateUrl: './layout.html',
    styleUrl: './layout.scss',
    standalone: true,
    imports: [Header, Footer, RouterOutlet]
})
export class LayoutComponent{

}