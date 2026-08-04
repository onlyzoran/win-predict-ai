import type { Component } from 'vue'
import {
  IconBallAmericanFootball,
  IconBallBaseball,
  IconBallBasketball,
  IconBallFootball,
  IconCar,
  IconFlag,
  IconGolf,
} from '@tabler/icons-vue'
import IconHockey from '@/components/icons/IconHockey.vue'
import type { Sport } from '@/types/sport'

export const sportIcons: Record<Sport, Component> = {
  football: IconBallFootball,
  basketball: IconBallBasketball,
  americanFootball: IconBallAmericanFootball,
  hockey: IconHockey,
  baseball: IconBallBaseball,
  motorsport: IconCar,
  golf: IconGolf,
  politics: IconFlag,
}
