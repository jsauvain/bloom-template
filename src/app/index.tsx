// Warm-canvas state. Rendered while the sandbox is up but the agent has not
// yet written its first screen file. The agent overwrites this file with the
// real index route on its first editFile call.
import { Body, Caption, Display, Motion, Stack, Surface } from '@/lib/primitives';

export default function Index() {
  return (
    <Surface>
      <Stack gap={3} align="center" justify="center" style={{ flex: 1 }}>
        <Motion preset="fade">
          <Display level={2}>Bloom canvas</Display>
        </Motion>
        <Motion preset="fade" delay={120}>
          <Body style={{ textAlign: 'center', maxWidth: 320 }}>
            Composing your app. Edits stream in here as the agent works.
          </Body>
        </Motion>
        <Motion preset="fade" delay={240}>
          <Caption>powered by Bloom · Expo · Daytona</Caption>
        </Motion>
      </Stack>
    </Surface>
  );
}
