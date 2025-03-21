import { Context, Schema } from 'koishi'

export const name = 'pointmintmarket-ncm'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // write your plugin here
}
