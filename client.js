const ENTER_KEY = 13;
const ESCAPE_KEY = 27;

let util = {
    uuid: function() {
        let uuidString = '';
        for (let i = 0; i < 32; i++) {
            if (i === 8 || i === 12 || i === 16 || i === 20) {
                uuidString += '-';
            }
            let randomInt = Math.floor(Math.random() * 16);
            uuidString += randomInt.toString(16);
        }
        return uuidString;
    },
    /**
        * save() stores data in the browser's local storage if both the
        * namespace and data arguments are passed in. If only namespace
        * is passed to save(), localStorage returns the data at that
        * namespace. If the namespace does not exist, and empty array is
        * returned.
        *
        * @param {String} namespace
        * @param {Array} data
        * @return {Array}
        */
    save: function(namespace, data) {
        if (arguments.length > 1) {
            localStorage.setItem(namespace, JSON.stringify(data));
        } else {
            return JSON.parse(localStorage.getItem(namespace)) || [];
        }
    },

    deleteAll: function() {
        throw new TypeError('this function has been disabled')
        // App.todos = [];
        // localStorage.clear('data');
    },
};

var App = {
    todos: util.save('data'),
    // todos: [],

    init: function() {
        controls.eventListeners();
        view.displayTodos();
    },

    createTodo: function(content) {
        let todo = {
            content: content,
            completed: false,
            nestedTodos: [],
            id: util.uuid()
        };
        this.todos.unshift(todo);
        view.displayTodos();
    },

    newNestedTodo: function(id, content, todos, todo) {
        todos = todos || App.todos;
        todo = todo || {
            content: content,
            completed: false,
            nestedTodos: [],
            id: util.uuid()
        };
        for (let i = 0; i < todos.length; i++) {
            if (!todos[i].id || Array.isArray(todos[i])) {
                unwrapTodo(todos[i]);
            }
            if (todos[i].id === id) {
                todos[i].nestedTodos.unshift(todo);
                view.displayTodos();
                return;
            } else if (todos[i].nestedTodos.length) {
                let nestedArray = todos[i].nestedTodos;
                this.newNestedTodo(id, content, nestedArray, todo);
            }
        }
        // view.displayTodos();
        return;
    },

    deleteTodo: function(id, todos) {
        todos = todos || App.todos;
        for (let i = 0; i < todos.length; i++) {
            if (!todos[i].id || Array.isArray(todos[i])) unwrapTodo(todos[i]);
            if (todos[i].id === id) {
                if ( (todos[i].nestedTodos.length && App.nestsComplete(todos[i]) === false) &&
                (window.confirm(`Not all subtasks are marked as complete and will be deleted.
                Are you sure you want to delete this item and all its nested content?`)) ||
                (todos[i].nestedTodos.length && App.nestsComplete(todos[i]) === true) ||
                (!todos[i].nestedTodos.length) ){
                    todos.splice(i, 1);
                    return view.displayTodos();
                }
            } else if (todos[i].nestedTodos.length) {
                let nestedArray = todos[i].nestedTodos;
                this.deleteTodo(id, nestedArray);
            }
        }
        view.displayTodos();
    },

    changeTodoContent: function(id, todos, newText) {
        todos = todos || App.todos;

        for (let i = 0; i < todos.length; i++) {
            if (!todos[i].id || Array.isArray(todos[i])) {
                unwrapTodo(todos[i]);
            }

            if (todos[i].id === id) {
                todos[i].completed = false;
                todos[i].content = newText;
            } else if (todos[i].nestedTodos.length) {
                let nestedArray = todos[i].nestedTodos;
                this.changeTodoContent(id, nestedArray, newText);
            }
        }
        view.displayTodos();
    },

    toggleCompleted: function(id, todos) {
        todos = todos || App.todos;
        function closeLoop(id, todos) {
            for (let i = 0; i < todos.length; i++) {
                if (todos[i].id === id) {
                    todos[i].completed = !todos[i].completed;
                    if (todos[i].completed === true) {
                        App.completeTreeTrue(todos[i].nestedTodos);
                    }
                    else {
                        App.completeTreeFalse(todos[i].nestedTodos);
                    }
                } else if (todos[i].nestedTodos.length) {
                    let nestedArray = todos[i].nestedTodos;
                    App.toggleCompleted(id, nestedArray);
                }
            }
        }
        closeLoop(id, todos);
        view.displayTodos();
    },

    completeTreeFalse: function(todos) {
        todos.map(function(todo) {
            todo.completed = false;
            if (todo.nestedTodos.length) {
                App.completeTreeFalse(todo.nestedTodos);
            }
        });

    },

    completeTreeTrue: function(todos) {
        todos.map(function(todo) {
            todo.completed = true;
            if (todo.nestedTodos.length) {
                App.completeTreeTrue(todo.nestedTodos);
            }
        });
    },

    nestsComplete: function(todos) {
        todos = todos.nestedTodos;
        return todos.every(function(item) {
            return item.completed;
        })
    },

    checkNestsForCompletion: function(todo) { // returns a boolean
        let id = todo.id;
        let isCompleted = true;
        let todos = todo.nestedTodos;
        let done;
        if (todos !== undefined && todos.length) {
            done = false;
            while (!done) {
                todos.forEach(function(todo) {
                    if (todo.completed) {
                        if (todo.nestedTodos.length) {
                            App.checkNestsForCompletion(todo.nestedTodos)
                        } else {
                            done = true;
                            return isCompleted;
                        }
                    } else {
                        done = true;
                        return isCompleted = false;
                    }
                });
            }
        }
        return isCompleted;
    },

    getCompletedProp: function(id, todos) {
        if (arguments.length < 2) {
             todos = App.todos;
        }
        for (let i = 0; i < todos.length; i ++) {
            if (todos[i].id === id) {
                return todos[i].completed;
            } else if (todos[i].nestedTodos.length) {
                this.getCompletedProp(id, todos[i].nestedTodos[0])
            }
        }
    },

    deleteCompleted: function(todos) {

        if (arguments.length < 1) {
            todos = App.todos;
        }
        App.todos = todos.filter(function(todo) {
            return !todo.completed;
        })
        view.displayTodos();
    },

    moveTodo: function(idToMove, targetId, todos) {
        let todoToMove;
        let moveIdx;
        let targetTodo;
        let targetIdx;
        let done = false;

        function closeLoop(idToMove, targetId, todos) {
            todos.forEach(function(todo, index, array) {
                if (!done) {
                    if (todo.id === idToMove) {
                        todoToMove = array[index];
                        moveIdx = index;
                    } else if (todo.id === targetId) {
                        targetTodo = todo;
                        targetIdx = index;
                    }

                    if (targetIdx !== undefined && todoToMove) {
                        if (moveIdx < targetIdx) {
                            array.splice(targetIdx + 1, 0, todoToMove);
                            array.splice(moveIdx, 1);
                        }
                        else {
                            array.splice(moveIdx, 1);
                            array.splice(targetIdx, 0, todoToMove);
                        }
                        done = true;
                    } else if (todo.nestedTodos.length) {
                        closeLoop(idToMove, targetId, array[index].nestedTodos)
                    }
                }
            })
        }
        closeLoop(idToMove, targetId, todos);
    },

    unwrapTodo: function(todo) {
        while (Array.isArray(todo)) {
            return todo[0];
        }
    },

    nestTodo: function(id, todos) {
        todos = todos || App.todos;
        let mainIdx = 0;
        let done = false;
        function closeLoop(id, todos) {
            for (let i = 0; i < todos.length; i++) {
                if (!done) {
                    if (todos[i].id === id) {
                        let target = todos[i - 1].nestedTodos;
                        let spliced = todos.splice(i, 1);
                        if (Array.isArray(spliced)) {
                            spliced = spliced[0];
                        }
                        target.push(spliced);
                        done = true;
                        return view.displayTodos()
                    } else if (todos[i].nestedTodos.length) {
                        let nestedArray = todos[i].nestedTodos;
                        closeLoop(id, nestedArray);
                    }
                }
            }
        }
        closeLoop(id, todos);
    },

    unnestTodo: function(id, todos) {
        todos = todos || App.todos;
        let mainTodos = App.todos;
        let mainIdx = 0;
        let done = false;
        let targetArray;
        function closeLoop(id, todos) {
            for (let i = 0; i < todos.length; i++) {
                if (!done) {
                    if (todos === mainTodos) mainIdx++;
                    if (todos[i].id === id) {
                        let todoToMove = todos[i];
                        todos.splice(i, 1);
                        if (todos === targetArray) {
                            targetArray = App.todos;
                        }
                        targetArray.splice(mainIdx, 0, todoToMove);
                        done = true;
                        return view.displayTodos();
                    } else if (todos[i].nestedTodos.length) {
                        targetArray = todos;
                        let nestedArray = todos[i].nestedTodos;
                        closeLoop(id, nestedArray);
                    }
                }
            }
        }
        closeLoop(id, todos);
    },

    unnestTotally: function(id, todos) {
        todos = todos || App.todos;
        let mainTodos = App.todos;
        let mainIdx = 0;
        let done = false;
        function closeLoop(id, todos) {
            for (let i = 0; i < todos.length; i++) {
                if (!done) {
                    if (todos === mainTodos) {
                        mainIdx++;
                    }
                    if (todos[i].id === id) {
                        let todoToMove = todos[i];
                        todos.splice(i, 1);
                        App.todos.splice(mainIdx, 0, todoToMove);
                        done = true;
                        return view.displayTodos();
                    } else if (todos[i].nestedTodos.length) {
                        let nestedArray = todos[i].nestedTodos;
                        closeLoop(id, nestedArray);
                    }
                }
            }
        }
        closeLoop(id, todos);
    }
};

let controls = {
    editInput: function(parent, label) {
        let toggle = label.previousElementSibling;
        let deleteButton = label.nextElementSibling;
        let nestedButton = deleteButton.nextElementSibling;
        toggle.style.visibility = 'hidden';
        deleteButton.style.visibility = 'hidden';
        nestedButton.style.visibility = 'hidden';
        let editInput = document.createElement('input');
        editInput.className = 'edit';
        parent.draggable = false;
        let nextParent = parent;
        while ( (nextParent.parentElement !== undefined) && (nextParent.parentElement.nodeName === 'LI' || nextParent.parentElement.parentElement.nodeName === 'LI') ) {
            nextParent.parentElement.draggable = false;
            nextParent = nextParent.parentElement;
        }
        parent.replaceChild(editInput, label);
        editInput.value = label.innerText;
        editInput.focus();
    },

    isClassIncluded: function(el, className) {
        let classes = [];
        for (let i = 0; i < el.classList.length; i++) {
            classes.push(el.classList[i])
        }
        return classes.includes(className);
    },

    eventListeners: function() {
        let mainDiv = document.getElementById('main');
        let todosUl = document.getElementById('todo-list');
        let todoInput = document.getElementById('todo-input');
        let clearCompleted = document.getElementById('clear-completed');
        let howToButton = document.getElementById('how-to-button');
        let howToDiv = document.getElementsByClassName('how-to')[0];

        howToButton.addEventListener('click', function(e) {
            howToDiv.classList.toggle('hidden');
            todosUl.classList.add('fadein');
            setTimeout(function() {
                todosUl.classList.remove('fadein');
            }, 500)

        });

        mainDiv.addEventListener('click', function(e) {
            let clearAll = document.getElementById('clear-button');
            let elClicked = e.target;
            if (elClicked === clearAll) {
                util.deleteAll();
            } else if (elClicked === clearCompleted) {
                App.deleteCompleted();
            }
        }, false);

        // Focus to Add Input; Escape Edit; Edit Todo
        document.addEventListener('keyup', function(e) {
            let el = e.target;
            let todo = el.closest('li');
            if ( (e.keyCode === 191 && !e.shiftKey) && el.tagName !== 'INPUT' ) { // '/' key
                todoInput.focus();
            } else if ( (e.which === ESCAPE_KEY) ) {
                if (controls.isClassIncluded(el, 'edit') || controls.isClassIncluded(todo.firstElementChild, 'add-new-nested') ) {
                    view.displayTodos();
                }
            } else if (e.which === ENTER_KEY && el.className === 'edit') {
                let todoId = todo.dataset.id;
                App.changeTodoContent(todoId, App.todos, el.value);
                view.displayTodos();
            }
        }, false);

        // Add New Todo
        todoInput.addEventListener('keydown', function(event) {
            if (event.keyCode === ENTER_KEY) {
                if (todoInput.value === '') return;
                App.createTodo(todoInput.value);
                todoInput.value = '';
                todoInput.focus();
            }
        }, false);

        let pickedUpX;
        let droppedX;
        let pickedUpY;
        let droppedY;

        // get X and Y position of grabbed element
        todosUl.addEventListener('mousedown', function(e) {
            pickedUpX = e.screenX;
            pickedUpY = e.screenY;
        }, false);

        //
        todosUl.addEventListener('click', function(e) {
            let elClicked = e.target;
            let todo = elClicked.closest('li');
            let label = elClicked.closest('label');
            let todoId = todo.dataset.id;
            if (elClicked.className !== 'edit') {
                if ( (e.altKey || e.shiftKey) && label !== null ) {
                    controls.editInput(todo, label);
                } else if (elClicked.className === 'toggle') {
                    App.toggleCompleted(todoId);
                    todo.setAttribute('data-completed', App.getCompletedProp(todoId));
                    if (todo.dataset.completed === 'false') {
                        // run function to recursively complete false up the tree
                        if (!todo.parentElement) return;
                        let parent = todo.parentElement.previousElementSibling;
                        while (parent && parent.dataset.completed === 'true') {
                            App.toggleCompleted(parent.dataset.id);
                            parent.dataset.completed = 'false';
                            parent = todo.parentElement.previousElementSibling.parentElement.previousElementSibling;
                        }
                    }
                } else if (elClicked.className === 'todo-label') {
                    let isFirst = todo.parentElement.firstElementChild;
                    let parentId = todo.parentElement.id;
                    if (todo === isFirst && parentId) {
                        return;
                    } else if (todo.previousElementSibling) {
                        App.nestTodo(todoId);
                    } else if (todo.previousElementSibling === null) {
                        App.unnestTodo(todoId);
                    } else {
                        return;
                    }
                } else if (e.target.className === 'delete') {
                    App.deleteTodo(todoId);
                } else if (e.target.className === 'new-nested') {
                    e.preventDefault();
                    let ul;
                    if (todo.lastChild.tagName !== 'UL') {
                        ul = document.createElement('ul');
                        todo.append(ul);
                        console.log(ul)
                    } else {
                        ul = todo.lastChild
                    }
                    let li = document.createElement('li');
                    let input = document.createElement('input');
                    input.classList.add('add-new-nested', 'edit');
                    li.append(input);
                    ul.prepend(li);
                    input.focus();
                    input.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter') {
                            if (input.value) App.newNestedTodo(todoId, input.value);
                        }
                    })
                }
                // if (!e.altKey && !e.shiftKey) {
                //     view.displayTodos();
                // }
            }
        }, false);

        let draggedTodo;
        let targetTodo;

        window.addEventListener('drag', function(e) {
            let elDragged = e.target;
            let todo = elDragged.closest('li');
            if (elDragged.className === 'li') {
                draggedTodo = todo.dataset.id;
            }
        }, false);

        window.addEventListener("dragover", function(event) {
            event.preventDefault();
        }, false);

        window.addEventListener('drop', function(e) {
            droppedX = e.screenX;
            droppedY = e.screenY;
            if ( (pickedUpX - droppedX !== NaN) && (pickedUpX - droppedX) > 88) {
                App.unnestTotally(draggedTodo);
            } else if ( (pickedUpX - droppedX !== NaN) &&
            (pickedUpX - droppedX <= 88 && pickedUpX - droppedX >= 1) ) {
                if (pickedUpY - droppedY < 40 && droppedY - pickedUpY < 40) {
                    App.unnestTodo(draggedTodo);
                }
            } else if ( (droppedX - pickedUpX != NaN) &&
            (droppedX - pickedUpX > 22) ) {
                App.nestTodo(draggedTodo);
            }
            let dropTarget = e.target.closest('li');
            e.preventDefault();
            if (dropTarget) {
                targetTodo = dropTarget.dataset.id;
                App.moveTodo(draggedTodo, targetTodo, App.todos);
            }
            view.displayTodos();
        }, false);
    },
    capitalize: function(str) {
        let noncap = ['the', 'for'];
        let split = str.split(' ');
        return split.map((word, i) => {
            if ( ( !noncap.includes(word) && word.length > 2 ) ||
            i === 0 ||
            word ==='i' ) return word.charAt(0).toUpperCase() + word.slice(1);
            return word;
        }).join(' ');
    }
};

let view = {
    displayTodos: function() {
        util.save('data', App.todos);
        let todos = App.todos;
        let todosUl = document.getElementById('todo-list');
        let todoInput = document.getElementById('todo-input');
        let endOfTree = false;
        let index = 0;
        if (!todos.length) {
            todosUl.innerHTML = 'Nothing To Do!';
        } else {
            todosUl.innerHTML = '';
            function renderAll(list, ul) {
                list = list || todos;
                ul = ul || todosUl;
                list.forEach(function(todo) {
                    while (!todo.content) {
                        todo = App.unwrapTodo(todo);
                    }
                    let li = document.createElement('li');
                    li.setAttribute('data-id', todo.id);
                    li.setAttribute('data-completed', todo.completed);
                    li.className = 'li';
                    li.draggable = true;
                    let todoLabel = document.createElement('label');
                    todoLabel.className = 'todo-label';
                    todoLabel.textContent = controls.capitalize(todo.content);
                    let input = document.createElement('input');
                    input.className = 'toggle';
                    input.setAttribute('type', 'checkbox');
                    if (todo.completed) {
                        input.checked = true;
                        todoLabel.style.cssText = "text-decoration: line-through;";
                    }
                    let deleteButton = document.createElement('button');
                    deleteButton.className = 'delete';
                    deleteButton.textContent = 'X';
                    let addNestedButton = document.createElement('button');
                    addNestedButton.className = 'new-nested';
                    addNestedButton.textContent = '+';
                    li.appendChild(input);
                    li.appendChild(todoLabel);
                    li.appendChild(deleteButton);
                    li.appendChild(addNestedButton);
                    ul.appendChild(li);
                    if (endOfTree) {
                        list = todo;
                        endOfTree = false;
                    }
                    while (!list.nestedTodos) {
                        list = list[0];
                    }
                    if (list.nestedTodos.length && index in list.nestedTodos !== false) {
                        while (!list.nestedTodos) {
                            list.nestedTodos = list.nestedTodos[0];
                        }
                        list = list.nestedTodos;
                        let newUl = document.createElement('ul');
                        newUl.className = 'nested';
                        li.appendChild(newUl);
                        renderAll(list, newUl);
                    } else {
                        endOfTree = true;
                    }
                })
            }
            renderAll(todos, todosUl);
        }
    },
};

App.init();