import { SceneParticipant } from "./scene.participant.model";

export interface AdminScene {
    id: number;
    name: string;
    description: string;
    participants: SceneParticipant[];
}
