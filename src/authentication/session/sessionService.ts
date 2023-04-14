import {getSessionsCollection} from "../../services/database";
import {MongoSession} from "./types";

const getSession = (sessionId: string) => getSessionsCollection().findOne({sessionId});

const setSession = (session: MongoSession) => getSessionsCollection().insertOne(session);

const deleteSession = (sessionId: string) => getSessionsCollection().deleteOne({sessionId});

export {getSession,setSession, deleteSession}
