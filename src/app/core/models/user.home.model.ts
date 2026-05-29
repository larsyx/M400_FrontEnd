import { IAuxs } from "./auxs.model";
import { Fader } from "./fader.model";

export interface IUserHome{
    fader: Fader[],
    aux: IAuxs[],
    auxUser: IAuxs
}