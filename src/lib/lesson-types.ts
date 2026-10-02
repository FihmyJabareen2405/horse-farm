export type LessonError='invalid'|'time'|'farm'|'save'|'disabled'|'inactive'|'conflict'|'stale'|'future';
export type LessonResult={ok:true;day?:string}|{ok:false;error:LessonError};
export type Choice={id:number;name:string;isActive:boolean};
export type ArenaChoice={id:number;nameHe:string;nameAr:string;isActive:boolean};
export type LessonAuditView={id:number;action:'CREATED'|'UPDATED'|'CANCELLED'|'COMPLETED';descriptionHe:string;descriptionAr:string;createdAt:string;actorName:string|null};
export type LessonView={id:number;startsAt:string;endsAt:string;updatedAt:string;status:'SCHEDULED'|'COMPLETED'|'CANCELLED';notes:string|null;instructorId:number;arenaId:number;instructorName:string;arenaHe:string;arenaAr:string;participants:{riderId:number;horseId:number;riderName:string;horseName:string}[];audits:LessonAuditView[]};
