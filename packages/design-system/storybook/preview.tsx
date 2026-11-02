// .storybook/preview.tsx — theme switching for every story.
import type { Preview } from '@storybook/react';
import platform from '../generated/platform-default.css?inline';
import neon from '../generated/neon-pink.css?inline';
import pale from '../generated/pale-sun.css?inline';
import green from '../generated/default-green.css?inline';

const THEMES = { 'Default (green)': ['default-green', green], 'High saturation': ['neon-pink', neon], 'Low contrast': ['pale-sun', pale] } as const;

const preview: Preview = {
  globalTypes: {
    tenant:  { name: 'Tenant theme', defaultValue: 'Default (green)', toolbar: { icon: 'paintbrush', items: Object.keys(THEMES) } },
    mode:    { name: 'Mode',    defaultValue: 'light',       toolbar: { icon: 'circlehollow', items: ['light', 'dark'] } },
    density: { name: 'Density', defaultValue: 'comfortable', toolbar: { icon: 'component', items: ['comfortable', 'compact'] } },
    dir:     { name: 'Direction', defaultValue: 'ltr',       toolbar: { icon: 'transfer', items: ['ltr', 'rtl'] } },
    expand:  { name: 'Text expansion', defaultValue: '1',     toolbar: { icon: 'expand', items: ['1', '1.3', '1.6'] } },
  },
  decorators: [(Story, ctx) => {
    const [id, css] = THEMES[ctx.globals.tenant as keyof typeof THEMES];
    const root = document.documentElement;
    root.dataset.theme = ctx.globals.mode; root.dataset.tenant = id; root.dataset.density = ctx.globals.density; root.dir = ctx.globals.dir;
    return (<><style>{platform}{css}</style><div data-expand={ctx.globals.expand}><Story /></div></>);
  }],
  parameters: { a11y: { test: 'error' } }, // axe violations fail the story
};
export default preview;
