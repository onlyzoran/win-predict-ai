import type { Component } from 'vue'
import { sportIcons, type SportIconKey } from '@onlyzoran/win-predict-ai-icons'

export { sportIcons }
export type { SportIconKey }

export function getSportIcon(iconKey: string | undefined): Component | undefined {
  if (!iconKey || !(iconKey in sportIcons)) {
    return undefined
  }
  return sportIcons[iconKey as SportIconKey]
}
