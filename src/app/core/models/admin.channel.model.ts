import { TypeChannel } from "./fader.model";

export interface AdminChannel {
    id: number;
    name: string;
    description: string;
    type: TypeChannel | null;
    selected: boolean;
    position: number;
}
