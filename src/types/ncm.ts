
export interface NcmSearchList {
    code: number
    msg: string
    result?: NcmSongInfo[]
}

export interface NcmSongInfo {
    id: number
    name: string
    arName: string
    al: {
        id: number
        name: string
        picUrl: string
    }
}
