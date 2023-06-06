const { Component, mount, xml, reactive, useState, useRef, useEnv, onMounted } = owl;

// --------------------------------------------------------------------------
// Store
//  The useStore hook and the TaskList class compose the store for this file.
//  The TaskList defines the data held within the store, which is shared by
//  all components who acess the store. A component can access the store by
//  calling the useStore hook in their setup method. 
//
//  When state is modified in the store, all components who are using it will 
//  automatically receive notifications and update their state accordingly.
//  This is due to createTaskStore being called to establish the env, and it
//  creates a reactive instantiation of TaskList. Everytime the store is
//  modified, the tasks will be saved using the nested saveTasks function.
// --------------------------------------------------------------------------

// Hook: useStore
function useStore() {
    const env = useEnv();
    return useState(env.store);
}

// Class (non-component): TaskList
class TaskList {
    constructor(tasks) {
        // If there are existing tasks, use those. Otherwise start anew.
        this.tasks = tasks || [];
        const taskIds = this.tasks.map(t => t.id);
        // To get the nextId, the max of all Ids needs to be found (rather
        // than just using the length) to account for deleted tasks.
        this.nextId = taskIds.length ? Math.max(...taskIds) + 1 : 1;
    }

    addTask(text) {
        text = text.trim();
        if (!text) return;

        const newTask = {
            id: this.nextId++,
            text: text,
            isCompleted: false,
        };
        this.tasks.push(newTask);
    }

    toggleTask(task) {
        task.isCompleted = !task.isCompleted;
    }

    deleteTask(task) {
        const index = this.tasks.findIndex(t => t.id === task.id);
        this.tasks.splice(index, 1);
    }
}

// Function: createTaskStore
function createTaskStore() {
    function saveTasks() {
        localStorage.setItem("owl-todoapp", JSON.stringify(taskStore.tasks));
    }

    const initialTasks = JSON.parse(localStorage.getItem("owl-todoapp") || "[]")
    const taskStore = reactive(new TaskList(initialTasks), saveTasks);
    saveTasks(); // Initial observation
    return taskStore;
}


// --------------------------------------------------------------------------
// Auxiliary Components
//  The Task and InputField components support the Root component. 
//  Task contains the structure of each task and the relevant calls to the
//  store. The text for each task is used as a label and automatically mapped 
//  to its associated checkbox.
//  InputField creates a text field and associated label, with an automatically
//  generated name to map the label to the field. Additionally, the input field 
//  can optionally be focused when the page is loaded.
// --------------------------------------------------------------------------

// Component: Task
class Task extends Component {
    setup() {
        this.store = useStore();
    }
}
Task.props = ["task"]
Task.template = xml /*xml*/`
    <div class="task" t-att-class="props.task.isCompleted ? 'done' : ''">
        <input type="checkbox" t-att-checked="props.task.isCompleted" t-attf-id="task-checkbox-{{props.task.id}}" t-attf-name="task-checkbox-{{props.task.id}}" t-on-change="() => store.toggleTask(props.task)"/>
        <label t-attf-for="task-checkbox-{{props.task.id}}"><t t-esc="props.task.text"/></label>
        <span class="delete" t-on-click="() => store.deleteTask(props.task)">🗑</span>
    </div>
`;


// Component: InputField
class InputField extends Component {
    setup() {
        this.store = useStore();
        this.state = useState({
            technicalName: this.props.inputName.toLowerCase().replaceAll(' ', '-'),
        });
        if (this.props.isFocused) {
            const inputRef = useRef("add-input");
            onMounted(() => inputRef.el.focus());
        }
    }
}
InputField.props = ["inputName", "handleKeypress", "isFocused"]
InputField.template = xml /*xml*/`
    <div class="input-field">
        <label t-attf-for="input-field-{{this.state.technicalName}}"><t t-esc="props.inputName"/></label>
        <input type="text" t-ref="add-input" t-on-keypress="props.handleKeypress" t-attf-name="input-field-{{this.state.technicalName}}"/>
    </div>
`;


// --------------------------------------------------------------------------
// Main Component
//  This is the entrypoint for the todo list application. It displays the 
//  input field where the user can specify a new task using the InputField
//  component. Every task inside the store is then listed using the Task
//  component.
// --------------------------------------------------------------------------
// Component: Root
class Root extends Component {
    setup() {
        this.store = useStore();
    }

    addTask(e) {
        if (e.key === "Enter") {
            this.store.addTask(e.target.value);
            e.target.value = "";
        }
    }
}
Root.components = { InputField, Task };
Root.template = xml /*xml*/`
    <div class = "todo-app">
        <InputField inputName="'New Task'" handleKeypress.bind="addTask" isFocused="true"/>
        <div class="task-list">
            <t t-foreach="store.tasks" t-as="task" t-key="task.id">
                <Task task="task"/>
            </t>
        </div>
    </div>
`;


// Setup
const env = {
    store: createTaskStore(),
};
mount(Root, document.body, {dev: true, env});
