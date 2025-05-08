export function replaceIfNew(old:any, replacment:any){
    if(replacment){
        old = replacment
        return replacment
    }
    return old
}