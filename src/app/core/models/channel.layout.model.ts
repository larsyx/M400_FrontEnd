import { TypeChannel } from "./fader.model";

export interface ChannelLayout{
    channel_id: number,
    name: string,
    description: string,
    position: number,
    type: TypeChannel | null,
    selected: boolean
}
