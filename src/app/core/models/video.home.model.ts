import { IAuxs } from "./auxs.model";
import { Fader } from "./fader.model";

export interface IVideoHome{
    fader: Fader[],
    aux: IAuxs[],
    auxUser: IAuxs
}
