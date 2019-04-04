import {Links} from 'src/types/links'
import {Notification} from 'src/types'
import {TimeRange} from 'src/types/queries'
import {TimeMachinesState} from 'src/timeMachine/reducers'
import {AppState as AppPresentationState} from 'src/shared/reducers/app'
import {TasksState} from 'src/tasks/reducers'
import {RouterState} from 'react-router-redux'
import {MeState} from 'src/shared/reducers/v2/me'
import {NoteEditorState} from 'src/dashboards/reducers/notes'
import {DataLoadingState} from 'src/dataLoaders/reducers'
import {OnboardingState} from 'src/onboarding/reducers'
import {VariablesState} from 'src/variables/reducers'
import {OrgViewState} from 'src/organizations/reducers/orgView'
import {LabelsState} from 'src/labels/reducers'
import {BucketsState} from 'src/buckets/reducers'
import {TelegrafsState} from 'src/telegrafs/reducers'
import {TemplatesState} from 'src/templates/reducers'
import {AuthorizationsState} from 'src/authorizations/reducers'
import {RangeState} from 'src/dashboards/reducers/ranges'
import {ViewsState} from 'src/dashboards/reducers/views'
import {ScrapersState} from 'src/scrapers/reducers'
import {UserSettingsState} from 'src/userSettings/reducers'
import {DashboardsState} from 'src/dashboards/reducers/dashboards'
import {OrgsState} from 'src/organizations/reducers/orgs'

export interface AppState {
  VERSION: string
  labels: LabelsState
  buckets: BucketsState
  telegrafs: TelegrafsState
  links: Links
  app: AppPresentationState
  ranges: RangeState
  views: ViewsState
  dashboards: DashboardsState
  notifications: Notification[]
  timeMachines: TimeMachinesState
  routing: RouterState
  tasks: TasksState
  timeRange: TimeRange
  orgs: OrgsState
  orgView: OrgViewState
  me: MeState
  onboarding: OnboardingState
  noteEditor: NoteEditorState
  dataLoading: DataLoadingState
  variables: VariablesState
  tokens: AuthorizationsState
  templates: TemplatesState
  scrapers: ScrapersState
  userSettings: UserSettingsState
}

export type GetState = () => AppState
