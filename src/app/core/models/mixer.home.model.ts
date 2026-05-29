import { IAuxs } from "./auxs.model";
import { Fader } from "./fader.model";

export interface IMixerHome{
    fader: Fader[],
    aux: IAuxs[],
    dca: Fader[]
}