import { getTerminalUrl } from '../lib/store';

export default function TerminalFullView() {
  const url = getTerminalUrl();
  return (
    <div class="terminal-full-view">
      <iframe src={url} title="Terminal web attaquant" class="terminal-full-iframe" />
    </div>
  );
}
