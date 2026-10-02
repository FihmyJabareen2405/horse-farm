import {validDay} from './lesson-time';
export function positiveId(value:FormDataEntryValue|null):number {
 if(typeof value!=='string'||! /^[1-9]\d*$/.test(value))throw new Error('invalid');const id=Number(value);if(!Number.isSafeInteger(id)||id>2147483647)throw new Error('invalid');return id;
}
export function lessonVersion(value:FormDataEntryValue|null):Date {
 if(typeof value!=='string')throw new Error('invalid');const date=new Date(value);if(!Number.isFinite(date.getTime())||date.toISOString()!==value)throw new Error('invalid');return date;
}
export function parseLessonInput(form:FormData){
 const id=form.get('id')?positiveId(form.get('id')):null,version=id?lessonVersion(form.get('version')):null;
 const day=form.get('day'),time=form.get('time'),notes=form.get('notes');
 if(typeof day!=='string'||!validDay(day)||day>'2100-12-30'||typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||typeof notes!=='string'||notes.length>2000)throw new Error('invalid');
 const riders=form.getAll('riderId').map(positiveId),horses=form.getAll('horseId').map(positiveId);
 if(!riders.length||riders.length>50||riders.length!==horses.length||new Set(riders).size!==riders.length||new Set(horses).size!==horses.length)throw new Error('invalid');
 return {id,version,day,time,notes:notes.trim()||null,instructorId:positiveId(form.get('instructorId')),arenaId:positiveId(form.get('arenaId')),riders,horses,participants:riders.map((riderId,i)=>({riderId,horseId:horses[i]}))};
}
