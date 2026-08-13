import { FieldEntry, VoiceStyle } from '@/engine';

const VOICES: VoiceStyle[] = ['notebook', 'firstPerson', 'victorian', 'deadpan'];

/**
 * Parse entries.md (DATA_AND_ENGINE.md §2.3) into { id -> FieldEntry }.
 * Each entry is a `## <id> · <title>` block followed by optional
 * **Voice:** / **Year:** / **Credibility:** lines and a body, ended by `---` or EOF.
 * (Body paragraphs are joined into one for v1; multi-paragraph preservation is a later refinement.)
 */
export function parseEntries(markdown: string): Record<string, FieldEntry> {
  const entries: Record<string, FieldEntry> = {};
  const blocks = markdown.split(/^##\s+/m).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n');
    const header = lines[0];
    const headerMatch = header.match(/^(\S+)\s*·\s*(.+)$/);
    if (!headerMatch) continue;
    const id = headerMatch[1].trim();
    const title = headerMatch[2].trim();

    let voiceStyle: VoiceStyle = 'notebook';
    let yearReported: number | undefined;
    let witnessCredibility: FieldEntry['witnessCredibility'];
    const bodyLines: string[] = [];

    for (const raw of lines.slice(1)) {
      const line = raw.trim();
      if (line === '---') break;
      if (line === '') continue;

      const vm = line.match(/^\*\*Voice:\*\*\s*(.+)$/i);
      if (vm) {
        const v = vm[1].trim() as VoiceStyle;
        if (VOICES.includes(v)) voiceStyle = v;
        continue;
      }
      const ym = line.match(/^\*\*Year:\*\*\s*(\d+)$/i);
      if (ym) {
        yearReported = parseInt(ym[1], 10);
        continue;
      }
      const cm = line.match(/^\*\*Credibility:\*\*\s*(low|medium|high)$/i);
      if (cm) {
        witnessCredibility = cm[1].toLowerCase() as FieldEntry['witnessCredibility'];
        continue;
      }
      bodyLines.push(line);
    }

    entries[id] = {
      title,
      body: bodyLines.join(' ').replace(/\s+/g, ' ').trim(),
      voiceStyle,
      ...(yearReported !== undefined ? { yearReported } : {}),
      ...(witnessCredibility ? { witnessCredibility } : {}),
    };
  }

  return entries;
}
