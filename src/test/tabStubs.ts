import { defineComponent, h } from 'vue'

export const TabsStub = defineComponent({
  name: 'TabsStub',
  setup(_, { slots }) {
    return () => h('div', { 'data-testid': 'tabs' }, slots.default?.())
  },
})

export const TabsListStub = defineComponent({
  name: 'TabsListStub',
  setup(_, { slots }) {
    return () => h('div', { role: 'tablist' }, slots.default?.())
  },
})

export const TabsTriggerStub = defineComponent({
  name: 'TabsTriggerStub',
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => h('button', { role: 'tab', 'data-value': props.value }, slots.default?.())
  },
})

export const TabsContentStub = defineComponent({
  name: 'TabsContentStub',
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => h('div', { role: 'tabpanel', 'data-tab': props.value }, slots.default?.())
  },
})

export const tabStubs = {
  Tabs: TabsStub,
  TabsList: TabsListStub,
  TabsTrigger: TabsTriggerStub,
  TabsContent: TabsContentStub,
}
