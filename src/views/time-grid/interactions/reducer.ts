import type { CalendarEvent } from "../../../types.js";
import type {
    ActiveInteraction,
    InteractionAction
} from "./types.js";

export const reduceInteraction = <Event extends CalendarEvent, Resource>(
    state: ActiveInteraction<Event, Resource>,
    action: InteractionAction<Event, Resource>
): ActiveInteraction<Event, Resource> => {
    if (action.type === "begin") return action.interaction;
    if (
        state?.kind !== action.interaction.kind
        || state.handleKey !== action.interaction.handleKey
    ) return state;

    return action.type === "update" ? action.interaction : null;
};
