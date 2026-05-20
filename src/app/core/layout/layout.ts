import { Component } from "@angular/core";
import { Header } from "./header/header";
import { Footer } from "./footer/footer";
import { RouterOutlet } from "@angular/router";
import { LoaderComponent } from "../../shared/loader/loader.component";

@Component({
    selector: 'app-layout',
    templateUrl: './layout.html',
    styleUrl: './layout.scss',
    standalone: true,
    imports: [Header, Footer, RouterOutlet, LoaderComponent]
})
export class LayoutComponent{

}