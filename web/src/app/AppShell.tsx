import { CreateScreen, HomeScreen, JoinScreen, MenuScreen, RoomScreen, Topbar } from './screens';
import {
  buildCreateScreenProps,
  buildHomeScreenProps,
  buildJoinScreenProps,
  buildMenuScreenProps,
  buildRoomScreenProps,
  buildTopbarProps
} from './screenPropsBuilders';
import { usePointManagerApp } from './usePointManagerApp';

export default function AppShell() {
  const {
    navigation,
    spaces,
    transactions,
    room,
    formatters
  } = usePointManagerApp();

  const { screen } = navigation;
  const sharedInput = { navigation, spaces, transactions, room, formatters };
  const homeScreenProps = buildHomeScreenProps(navigation);
  const topbarProps = buildTopbarProps(sharedInput);
  const menuScreenProps = buildMenuScreenProps(sharedInput);
  const createScreenProps = buildCreateScreenProps(sharedInput);
  const joinScreenProps = buildJoinScreenProps(sharedInput);
  const roomScreenProps = buildRoomScreenProps(sharedInput, formatters);

  return (
    <main className="app-shell">
      <Topbar {...topbarProps} />

      {screen === 'home' ? <HomeScreen {...homeScreenProps} /> : null}
      {screen === 'menu' ? <MenuScreen {...menuScreenProps} /> : null}
      {screen === 'create' ? <CreateScreen {...createScreenProps} /> : null}
      {screen === 'join' ? <JoinScreen {...joinScreenProps} /> : null}
      {screen === 'room' ? (
        <RoomScreen {...roomScreenProps} />
      ) : null}
    </main>
  );
}
