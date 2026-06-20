export interface Fader{
    id: number,
    name: string,
    description: string,
    value: number,
    switch: boolean,
    type: TypeChannel | null,
    link: boolean,
    position: number | null
}

export enum TypeChannel{
    INSTRUMENT = "instrument",
    DRUM = "drum",
    VOICE = "voice"
}