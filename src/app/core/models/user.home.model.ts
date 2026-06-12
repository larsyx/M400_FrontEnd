import { IAuxs } from "./auxs.model";
import { Fader } from "./fader.model";
import { IProfile } from "./profile.model";

export interface IUserHome{
    fader: Fader[],
    aux: IAuxs[],
    profile: IProfile[],

    auxUser: IAuxs
}