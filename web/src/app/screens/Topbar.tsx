import { TopbarProps } from '../topbarProps';

export function Topbar(props: TopbarProps) {
  const { state, actions } = props;

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <span className="brand-mark">PM</span>
        <div>
          <strong>Point Manager</strong>
          <p>Home / Menu / Create / Join / Room</p>
        </div>
      </div>

      <div className="topbar-actions">
        <button type="button" className="nav-link" onClick={actions.onOpenHome}>
          Home
        </button>
        <button type="button" className="nav-link" onClick={actions.onOpenMenu}>
          Menu
        </button>
        <button type="button" className="nav-link" disabled={!state.canOpenRoom} onClick={actions.onOpenRoom}>
          Room
        </button>
      </div>
    </header>
  );
}