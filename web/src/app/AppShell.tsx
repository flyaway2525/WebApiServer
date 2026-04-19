import { CreateScreen, HomeScreen, JoinScreen, MenuScreen, RoomScreen, Topbar } from './screens';
import {
  buildCreateScreenProps,
  buildHomeScreenProps,
  buildJoinScreenProps,
  buildMenuScreenProps,
  buildRoomScreenProps,
  buildTopbarProps
} from './screenPropsBuilders';
import { formatActorLabel, formatTransactionLabel } from './transactions';
import { usePointManagerApp } from './usePointManagerApp';

export default function AppShell() {
  const {
    navigation,
    spaces,
    transactions,
    room
  } = usePointManagerApp();

  const { screen } = navigation;
  const sharedInput = { navigation, spaces, transactions, room };
  const homeScreenProps = buildHomeScreenProps(navigation);
  const topbarProps = buildTopbarProps(sharedInput);
  const menuScreenProps = buildMenuScreenProps(sharedInput);
  const createScreenProps = buildCreateScreenProps(sharedInput);
  const joinScreenProps = buildJoinScreenProps(sharedInput);
  const roomScreenProps = buildRoomScreenProps(sharedInput, {
    formatTransactionLabel,
    formatActorLabel
  });

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
