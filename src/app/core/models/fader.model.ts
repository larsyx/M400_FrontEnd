export interface Fader{
    id: number,
    name: string,
    description: string,
    value: number,
    switch: boolean,
    type: TypeChannel | null,
    link: boolean
}

export enum TypeChannel{
    INSTRUMENT = "instrument",
    DRUM = "drum",
    VOICE = "voice"
}