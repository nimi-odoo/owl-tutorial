const { Component, mount, xml, useState, useRef, onMounted } = owl;

// Owl Components

/*  Component: Task
 *  
 */
class Task extends Component {
    deleteTask() {
        this.props.onDelete(this.props.task);
    }
}
Task.props = ["task", "onChange", "onDelete"]
Task.template = xml /*xml*/`
    <div class="task" t-att-class="props.task.isCompleted ? 'done' : ''">
        <input type="checkbox" t-att-checked="props.task.isCompleted" t-attf-id="task-checkbox-{{props.task.id}}" t-attf-name="task-checkbox-{{props.task.id}}" t-on-change="(e) => props.onChange(e, props.task)"/>
        <label t-attf-for="task-checkbox-{{props.task.id}}"><t t-esc="props.task.text"/></label>
        <span class="delete" t-on-click="deleteTask">🗑</span>
    </div>`

/*  Component: InputField
 *  
 */
class InputField extends Component {
    setup() {
        this.state = useState({
            technicalName: this.props.inputName.toLowerCase().replaceAll(' ', '-'),
        });
        if (this.props.isFocused) {
            const inputRef = useRef("add-input");
            onMounted(() => inputRef.el.focus());
        }
    }
}
InputField.props = ["inputName", "onInput", "handleKeypress", "isFocused"]
InputField.template = xml /*xml*/`
    <div class="input-field">
        <label t-attf-for="input-field-{{this.state.technicalName}}"><t t-esc="props.inputName"/></label>
        <input type="text" t-ref="add-input" t-on-input="props.onInput" t-on-keypress="props.handleKeypress" t-attf-name="input-field-{{this.state.technicalName}}"/>
    </div>
`;

const tasks = [
    {
        id: 1,
        text: "buy milk",
        isCompleted: true,
    },
    {
        id: 2, 
        text: "clean house",
        isCompleted: false,
    },
];


/*  Component: Root
 *  Entrypoint for the owl app
 */
class Root extends Component {
    // this is a state variable, obviously don't modify any
    // of this programatically; only event driven changes
    // should occur. in a real implementation the demo data
    // should be loaded in here in setup()
    setup() {
        this.state = useState({
            input: "",
            nextId: 1,
            tasks: []
        });
    }
    updateTask(e, task) { 
        if (e.target.value === "on") {
            this.state.tasks[task.id-1].isCompleted = !task.isCompleted;
        }
    }
    updateInput(e) {
        this.state.input = e.target.value;
    }

    addTask(e) {
        if (e.key === "Enter") {
            const text = e.target.value;
            e.target.value = "";
            if (!text) return;
            const newTask = {
                id: this.state.nextId++,
                text: text,
                isCompleted: false,
            };
            this.state.tasks.push(newTask);
        }
    }
    deleteTask(task) {
        const index = this.state.tasks.findIndex(t => t.id === task.id);
        this.state.tasks.splice(index, 1);
    }
}

Root.components = { InputField, Task };
Root.template = xml /*xml*/`
<div class = "todo-app">
    <InputField inputName="'New Task'" onInput.bind="updateInput" handleKeypress.bind="addTask" isFocused="true"/>
    <div class="task-list">
        <t t-foreach="this.state.tasks" t-as="task" t-key="task.id">
            <Task task="task" onChange.bind="updateTask" onDelete.bind="deleteTask"/>
        </t>
    </div>
</div>`;





mount(Root, document.body, {dev: true});


