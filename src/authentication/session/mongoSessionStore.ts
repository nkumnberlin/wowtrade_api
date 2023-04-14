import {Session} from 'fastify';
import FastifySessionPlugin from "@fastify/session";
import SessionStore = FastifySessionPlugin.SessionStore;
import {deleteSession, getSession, setSession} from "./sessionService";

export class MongoSessionStore implements SessionStore {

    get(sessionId: string, callback: (err: (Error | null), session: Session) => void) {
        // get by id
        getSession(sessionId).then((mongoSession) => {
            if(!mongoSession){
                throw new Error("Session not found!");
            }
            callback(null, mongoSession)
        }, (err) => callback(err, {} as Session));
    }

    set(sessionId: string, session: Session, callback: (err?: Error) => void) {
        session.sessionId = sessionId;
        setSession(session).then(console.log, callback);
    }

    destroy(sessionId: string, callback: (err?: Error) => void) {
        deleteSession(sessionId).then(console.log, callback);
    }
}
