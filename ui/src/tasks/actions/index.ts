// Libraries
import {push, goBack} from 'react-router-redux'
import _ from 'lodash'

// APIs
import {LogEvent, ITask as Task} from '@influxdata/influx'
import {client} from 'src/utils/api'
import {notify} from 'src/shared/actions/notifications'
import {
  taskNotCreated,
  tasksFetchFailed,
  taskDeleteFailed,
  taskNotFound,
  taskUpdateFailed,
  taskImportFailed,
  taskImportSuccess,
  taskUpdateSuccess,
  taskCreatedSuccess,
  taskDeleteSuccess,
  taskCloneSuccess,
  taskCloneFailed,
  taskRunSuccess,
  taskGetFailed,
} from 'src/shared/copy/v2/notifications'

// Actions
import {setExportTemplate} from 'src/templates/actions'

// Constants
import * as copy from 'src/shared/copy/notifications'

// Types
import {AppState, Label} from 'src/types'

// Utils
import {getErrorMessage} from 'src/utils/api'
import {insertPreambleInScript} from 'src/shared/utils/insertPreambleInScript'
import {TaskOptionKeys, TaskSchedule} from 'src/utils/taskOptionsToFluxScript'
import {taskToTemplate} from 'src/shared/utils/resourceToTemplate'

// Types
import {RemoteDataState} from '@influxdata/clockface'
import {Run} from 'src/tasks/components/TaskRunsPage'

export type Action =
  | SetNewScript
  | SetTasks
  | SetSearchTerm
  | SetCurrentScript
  | SetCurrentTask
  | SetShowInactive
  | SetTaskInterval
  | SetTaskCron
  | ClearTask
  | SetTaskOption
  | SetAllTaskOptions
  | SetRuns
  | SetLogs
  | UpdateTask

type GetStateFunc = () => AppState

export interface SetAllTaskOptions {
  type: 'SET_ALL_TASK_OPTIONS'
  payload: Task
}

export interface ClearTask {
  type: 'CLEAR_TASK'
}

export interface SetTaskInterval {
  type: 'SET_TASK_INTERVAL'
  payload: {
    interval: string
  }
}

export interface SetTaskCron {
  type: 'SET_TASK_CRON'
  payload: {
    cron: string
  }
}

export interface SetNewScript {
  type: 'SET_NEW_SCRIPT'
  payload: {
    script: string
  }
}
export interface SetCurrentScript {
  type: 'SET_CURRENT_SCRIPT'
  payload: {
    script: string
  }
}
export interface SetCurrentTask {
  type: 'SET_CURRENT_TASK'
  payload: {
    task: Task
  }
}

export interface SetTasks {
  type: 'SET_TASKS'
  payload: {
    tasks: Task[]
  }
}

export interface SetSearchTerm {
  type: 'SET_SEARCH_TERM'
  payload: {
    searchTerm: string
  }
}

export interface SetShowInactive {
  type: 'SET_SHOW_INACTIVE'
  payload: {}
}

export interface SetTaskOption {
  type: 'SET_TASK_OPTION'
  payload: {
    key: TaskOptionKeys
    value: string
  }
}

export interface SetRuns {
  type: 'SET_RUNS'
  payload: {
    runs: Run[]
    runStatus: RemoteDataState
  }
}

export interface SetLogs {
  type: 'SET_LOGS'
  payload: {
    logs: LogEvent[]
  }
}

export interface UpdateTask {
  type: 'UPDATE_TASK'
  payload: {
    task: Task
  }
}

export const setTaskOption = (taskOption: {
  key: TaskOptionKeys
  value: string
}): SetTaskOption => ({
  type: 'SET_TASK_OPTION',
  payload: {...taskOption},
})

export const setAllTaskOptions = (task: Task): SetAllTaskOptions => ({
  type: 'SET_ALL_TASK_OPTIONS',
  payload: {...task},
})

export const clearTask = (): ClearTask => ({
  type: 'CLEAR_TASK',
})

export const setNewScript = (script: string): SetNewScript => ({
  type: 'SET_NEW_SCRIPT',
  payload: {script},
})

export const setCurrentScript = (script: string): SetCurrentScript => ({
  type: 'SET_CURRENT_SCRIPT',
  payload: {script},
})

export const setCurrentTask = (task: Task): SetCurrentTask => ({
  type: 'SET_CURRENT_TASK',
  payload: {task},
})

export const setTasks = (tasks: Task[]): SetTasks => ({
  type: 'SET_TASKS',
  payload: {tasks},
})

export const setSearchTerm = (searchTerm: string): SetSearchTerm => ({
  type: 'SET_SEARCH_TERM',
  payload: {searchTerm},
})

export const setShowInactive = (): SetShowInactive => ({
  type: 'SET_SHOW_INACTIVE',
  payload: {},
})

export const setRuns = (runs: Run[], runStatus: RemoteDataState): SetRuns => ({
  type: 'SET_RUNS',
  payload: {runs, runStatus},
})

export const setLogs = (logs: LogEvent[]): SetLogs => ({
  type: 'SET_LOGS',
  payload: {logs},
})

export const updateTask = (task: Task): UpdateTask => ({
  type: 'UPDATE_TASK',
  payload: {task},
})

// Thunks
export const addTaskLabelsAsync = (taskID: string, labels: Label[]) => async (
  dispatch
): Promise<void> => {
  try {
    await client.tasks.addLabels(taskID, labels.map(l => l.id))
    const task = await client.tasks.get(taskID)

    dispatch(updateTask(task))
  } catch (error) {
    console.error(error)
    dispatch(copy.addTaskLabelFailed())
  }
}

export const removeTaskLabelsAsync = (
  taskID: string,
  labels: Label[]
) => async (dispatch): Promise<void> => {
  try {
    await client.tasks.removeLabels(taskID, labels.map(l => l.id))
    const task = await client.tasks.get(taskID)

    dispatch(updateTask(task))
  } catch (error) {
    console.error(error)
    dispatch(copy.removeTaskLabelFailed())
  }
}

export const updateTaskStatus = (task: Task) => async dispatch => {
  try {
    await client.tasks.updateStatus(task.id, task.status)

    dispatch(populateTasks())
    dispatch(notify(taskUpdateSuccess()))
  } catch (e) {
    console.error(e)
    const message = getErrorMessage(e)
    dispatch(notify(taskUpdateFailed(message)))
  }
}

export const updateTaskName = (task: Task) => async dispatch => {
  try {
    await client.tasks.update(task.id, task)

    dispatch(populateTasks())
    dispatch(notify(taskUpdateSuccess()))
  } catch (e) {
    console.error(e)
    const message = getErrorMessage(e)
    dispatch(notify(taskUpdateFailed(message)))
  }
}

export const deleteTask = (task: Task) => async dispatch => {
  try {
    await client.tasks.delete(task.id)

    dispatch(populateTasks())
    dispatch(notify(taskDeleteSuccess()))
  } catch (e) {
    console.error(e)
    const message = getErrorMessage(e)
    dispatch(notify(taskDeleteFailed(message)))
  }
}

export const cloneTask = (task: Task, _) => async dispatch => {
  try {
    await client.tasks.clone(task.id)

    dispatch(notify(taskCloneSuccess(task.name)))
    dispatch(populateTasks())
  } catch (e) {
    console.error(e)
    const message = getErrorMessage(e)
    dispatch(notify(taskCloneFailed(task.name, message)))
  }
}

export const populateTasks = () => async (
  dispatch,
  getState: GetStateFunc
): Promise<void> => {
  try {
    const {
      orgs: {org},
    } = getState()

    const user = await client.users.me()
    const tasks = await client.tasks.getAllByUser(user)

    const mappedTasks = tasks.map(task => ({...task, organization: org}))
    dispatch(setTasks(mappedTasks))
  } catch (e) {
    console.error(e)
    const message = getErrorMessage(e)
    dispatch(notify(tasksFetchFailed(message)))
  }
}

export const selectTaskByID = (id: string, route?: string) => async (
  dispatch
): Promise<void> => {
  try {
    const task = await client.tasks.get(id)

    return dispatch(setCurrentTask({...task}))
  } catch (e) {
    console.error(e)
    dispatch(goToTasks(route))
    const message = getErrorMessage(e)
    dispatch(notify(taskNotFound(message)))
  }
}

export const selectTask = (task: Task, route?: string) => async (
  dispatch,
  getState: GetStateFunc
) => {
  if (route) {
    dispatch(push(route))
    return
  }
  const {
    orgs: {org},
  } = getState()

  dispatch(push(`orgs/${org.id}/tasks/${task.id}`))
}

export const goToTasks = (route?: string) => async (
  dispatch,
  getState: GetStateFunc
) => {
  if (route) {
    dispatch(push(route))
    return
  }
  const {
    orgs: {org},
  } = getState()

  dispatch(push(`orgs/${org.id}/tasks`))
}

export const cancel = () => async dispatch => {
  dispatch(setCurrentTask(null))
  dispatch(goBack())
}

export const updateScript = (route?: string) => async (
  dispatch,
  getState: GetStateFunc
) => {
  try {
    const {
      tasks: {currentScript: script, currentTask: task, taskOptions},
    } = getState()

    const updatedTask: Partial<Task> & {name: string; flux: string} = {
      flux: script,
      name: taskOptions.name,
      offset: taskOptions.offset,
    }

    if (taskOptions.taskScheduleType === TaskSchedule.interval) {
      updatedTask.every = taskOptions.interval
    } else {
      updatedTask.cron = taskOptions.cron
    }

    await client.tasks.update(task.id, updatedTask)

    dispatch(setCurrentTask(null))
    dispatch(goToTasks(route))
    dispatch(notify(taskUpdateSuccess()))
  } catch (e) {
    console.error(e)
    const message = getErrorMessage(e)
    dispatch(notify(taskUpdateFailed(message)))
  }
}

export const saveNewScript = (
  script: string,
  preamble: string,
  route?: string
) => async (dispatch, getState: GetStateFunc): Promise<void> => {
  try {
    const fluxScript = await insertPreambleInScript(script, preamble)

    const {
      orgs: {org},
    } = getState()
    await client.tasks.createByOrgID(org.id, fluxScript)

    dispatch(setNewScript(''))
    dispatch(clearTask())
    dispatch(populateTasks())
    dispatch(goToTasks(route))
    dispatch(notify(taskCreatedSuccess()))
  } catch (error) {
    console.error(error)
    const message = getErrorMessage(error)
    dispatch(notify(taskNotCreated(message)))
  }
}

export const importTask = (script: string) => async (
  dispatch,
  getState: GetStateFunc
): Promise<void> => {
  try {
    if (_.isEmpty(script)) {
      dispatch(notify(taskImportFailed('File is empty')))
      return
    }

    const {
      orgs: {org},
    } = await getState()

    await client.tasks.create(org.id, script)

    dispatch(populateTasks())

    dispatch(notify(taskImportSuccess()))
  } catch (error) {
    console.error(error)
    const message = getErrorMessage(error)
    dispatch(notify(taskImportFailed(message)))
  }
}

export const getRuns = (taskID: string) => async (dispatch): Promise<void> => {
  try {
    dispatch(setRuns([], RemoteDataState.Loading))

    const runs = await client.tasks.getRunsByTaskID(taskID)

    const runsWithDuration = runs.map(run => {
      const finished = new Date(run.finishedAt)
      const started = new Date(run.startedAt)

      return {
        ...run,
        duration: `${finished.getTime() - started.getTime()} seconds`,
      }
    })

    dispatch(setRuns(runsWithDuration, RemoteDataState.Done))
  } catch (error) {
    console.error(error)
    const message = getErrorMessage(error)
    dispatch(notify(taskGetFailed(message)))
    dispatch(setRuns([], RemoteDataState.Error))
  }
}

export const runTask = (taskID: string) => async dispatch => {
  try {
    await client.tasks.startRunByTaskID(taskID)
    dispatch(notify(taskRunSuccess()))
  } catch (error) {
    console.error(error)
  }
}

export const getLogs = (taskID: string, runID: string) => async (
  dispatch
): Promise<void> => {
  try {
    const logs = await client.tasks.getLogEventsByRunID(taskID, runID)
    dispatch(setLogs(logs))
  } catch (error) {
    console.error(error)
    dispatch(setLogs([]))
  }
}

export const convertToTemplate = (taskID: string) => async (
  dispatch,
  getState: GetStateFunc
): Promise<void> => {
  try {
    dispatch(setExportTemplate(RemoteDataState.Loading))

    const {
      orgs: {org},
    } = await getState()
    const task = await client.tasks.get(taskID)
    const taskTemplate = taskToTemplate(task)

    dispatch(setExportTemplate(RemoteDataState.Done, taskTemplate, org.id))
  } catch (error) {
    dispatch(setExportTemplate(RemoteDataState.Error))
    dispatch(notify(copy.createTemplateFailed(error)))
  }
}
