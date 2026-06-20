import { TypeChannel } from "./fader.model";

export interface Channel {
    id: number;
    name: string;
    description: string;
    type: TypeChannel | null;
    position: number | null;
}
