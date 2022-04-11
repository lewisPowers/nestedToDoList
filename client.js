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
        view.eventListeners();
        view.displayTodos();
    },

    // Create new todo and add it to the todos array.
    // addTodo: function(todo) {
    //     this.todos.push(new Todo(todo));
    //     view.displayTodos();
    // },
    createTodo: function(content) {
        let todo = {
            content: content,
            completed: false,
            nestedTodos: [],
            id: util.uuid()
        };
        this.todos.push(todo);
        view.displayTodos();
    },

    deleteTodo: function(id, todos) {
        todos = todos || App.todos;

        for (let i = 0; i < todos.length; i++) {
            if (!todos[i].id || Array.isArray(todos[i])) {
                unwrapTodo(todos[i]);
            } else if (todos[i].id === id) {
                if (todos[i].nestedTodos.length) {
                    if (!App.checkNestsForCompletion(todos[i])) {
                        return;
                    }
                }
                return todos.splice(i, 1);
            }

            if (todos[i].nestedTodos.length) {
                let nestedArray = todos[i].nestedTodos;
                this.deleteTodo(id, nestedArray);
            }
        }
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
                        // App.fixCompletion(id);
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

    fixCompletion: function(id, todos, chain) {
        todos = todos || App.todos;
        chain = chain || 'App.todos';
        let nest = 'nestedTodos';
        function closeLoop(id,todos, chain) {
            for (let i = 0; i < todos.length; i++) {
                chain = chain + '[' + i + ']';
                if (todos[i].id === id) {
                    if (todos[i].completed) {
                        if (!App.checkNestsForCompletion(todos[i])) {
                        // if (!App.nestsComplete(todos[i].nestedTodos[0])) {
                            todos[i].completed = false;
                        }
                    } else if (todos[i].nestedTodos.length && App.checkNestsForCompletion(todos[i].nestedTodos[0])) {
                        chain = chain + nest;
                        App.fixCompletion(id, todos[i].nestedTodos[0], chain)
                    }
                }
            }
        }
        closeLoop(id,todos.chain);
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

    // check todo for completion

    // if complete, check todo for nested todos
        // else return false

    // if nested todos.length, check all for completion
        // else return true

    // if one is not

    nestsComplete: function(todos) {
        return todos.every(function(item) {
            return item.completed;
        })
    },

    checkNestsForCompletion: function(todo) { // returns a boolean
        let id = todo.id;
        let isCompleted = true;
        let todos = todo.nestedTodos;
        let done;
        // let nestedTodosAreComplete = App.nestsComplete(todos);
        // if (Array.isArray(todo)) {

        // }
        if (todos.length) {
            done = false;
            while (!done) {
                todos.forEach(function(todo, i) {
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

            // if (!todo.id && Array.isArray(todo)) {
            //     todo = this.unwrapTodo(todo);
            // }

            // if (todo.completed === false) {
            //     console.log(todo + ': Not Completed');
            //     return todo;
            // } else if (todo.nestedTodos.length) {
            //     let nestedArray = todo.nestedTodos;
            //     App.deleteCompleted(nestedArray);
            // }
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
        console.log('A todo needed to be unwrapped.')
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
                        return done = true;
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
                    if (todos === mainTodos) {
                        mainIdx++;
                    }
                    if (todos[i].id === id) {
                        let todoToMove = todos[i];
                        todos.splice(i, 1);
                        if (todos === targetArray) {
                            targetArray = App.todos;
                        }
                        targetArray.splice(mainIdx, 0, todoToMove);
                        return done = true;
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
                        return done = true;
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

function logIds(todos) {

    todos = todos || App.todos;
    todos.forEach(function(todo) {
        if (!todo.id) {
            return todo[0];
        } else if (Array.isArray(todo)) {
            return todo[0];
        } else {
            console.log(todo.id);
        }

        if (todo.nestedTodos.length) {
            let nestedArray = todo.nestedTodos;
            return logIds(nestedArray);
        }
    })
};

function getTodoById(id, todos) {

    todos = todos || App.todos;
    todos.forEach(function(todo) {
        if (!todo.id) {
            return todo[0];
        } else if (Array.isArray(todo)) {
            return todo[0];
        } else  if (todo.id === id) {
            return todo;
        }

        if (todo.nestedTodos.length) {
            let nestedArray = todo.nestedTodos;
            return getTodoById(id, nestedArray);
        }
    })
};

function getTodoIdxById(id, todos) {

    todos = todos || App.todos;
    for (let i = 0; i < todos.length; i++) {
        let todo = todos[i];
        if (!todo.id || Array.isArray(todo)) {
            return todo[0];
        } else  if (todo.id === id) {
            return i;
        }

        if (todo.nestedTodos.length) {
            let nestedArray = todo.nestedTodos;
            return getTodoIdxById(id, nestedArray);
        }
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
            todosUl.innerHTML = 'No Todos!';
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
                    todoLabel.innerHTML = todo.content;
                    let input = document.createElement('input');
                    input.className = 'toggle';
                    input.setAttribute('type', 'checkbox');
                    if (todo.completed) {
                        // debugger;
                        // if todo has nested todos
                        // if (todo.nestedTodos.length) {
                            // run check on nested todos for completion
                            // if (App.checkNestsForCompletion(todo) === false) {
                            //     // if any are incomplete,
                            //     todo.completed = false;
                            //     input.checked = false;
                            // }
                        // } else {
                            input.checked = true;
                            todoLabel.style.cssText = "text-decoration: line-through;";
                        // }
                    }
                    let deleteButton = document.createElement('button');
                    deleteButton.className = 'delete';
                    deleteButton.innerText = 'X';

                    li.appendChild(todoLabel);
                    li.appendChild(input);
                    li.appendChild(deleteButton);
                    ul.appendChild(li);

                    if (endOfTree) {
                        list = todo;
                        endOfTree = false;
                    }
                    // if nested todos, append new ul and repeat previous steps
                    while (!list.nestedTodos) {
                        // console.log('line 446 displayTodos(): list did not have nested todos')
                        list = list[0];
                    }

                    if (list.nestedTodos.length && index in list.nestedTodos !== false) {
                        while (!list.nestedTodos) {
                            list.nestedTodos = list.nestedTodos[0];
                        }
                        // switch list to nested array
                        list = list.nestedTodos;
                        // create and append new ul to parent ul
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
        // todoInput.focus();
    },

    editInput: function(parent, label) {
        let editInput = document.createElement('input');
        editInput.className = 'edit';
        parent.draggable = false;
        parent.replaceChild(editInput, label);
        editInput.value = label.innerText;
        editInput.focus();
    },

    eventListeners: function() {
        let mainDiv = document.getElementById('main');
        let todosUl = document.getElementById('todo-list');
        let todoInput = document.getElementById('todo-input');
        let clearCompleted = document.getElementById('clear-completed');
        let label = document.querySelectorAll('.todo-label');


        mainDiv.addEventListener('click', function(e) {
            let clearAll = document.getElementById('clear-button');
            // let editInput = document.querySelector('input.edit')
            let elClicked = e.target;

            // if (elClicked.className === 'edit') {
            //     e.preventDefault();
            //     return elClicked.focus();
            // } else
            // if (elClicked === editInput) {
            //     return;
            // }
            if (elClicked === clearAll) {
                util.deleteAll();
            } else if (elClicked === clearCompleted) {
                App.deleteCompleted();
            }
            // view.displayTodos();
        }, false);

        document.addEventListener('keyup', function(e) {
            let el = e.target;
            let todo = el.closest('li');


            if (e.keyCode === 191 && !e.shiftKey) { // '/' key
                todoInput.focus();
            } else if (e.which === ESCAPE_KEY && el.className === 'edit') {
                view.displayTodos();
            } else if (e.which === ENTER_KEY && el.className === 'edit') {
                let todoId = todo.dataset.id;
                App.changeTodoContent(todoId, App.todos, el.value);
                view.displayTodos();
            }

        }, false);

        todoInput.addEventListener('keydown', function(event) {

            if (event.keyCode === ENTER_KEY) {
                if (todoInput.value === '') {
                    return;
                } else {
                    App.createTodo(todoInput.value);
                    todoInput.value = '';
                    todoInput.focus();
                }
            }
        }, false);

        let pickedUp;
        let dropped;

        todosUl.addEventListener('mousedown', function(e) {
            pickedUp = e.screenX;
        }, false);

        todosUl.addEventListener('click', function(e) {
            // debugger;
            // let timesClicked = e.detail;
            let elClicked = e.target;
            let todo = elClicked.closest('li');
            let label = elClicked.closest('label');
            let todoId = todo.dataset.id;

            // if (elClicked.className === 'edit') {
            //     e.preventDefault();
            //     return elClicked.focus();
            // } else
            if (e.altKey || e.shiftKey) {
                view.editInput(todo, label);

            } else if (elClicked.className === 'toggle') {
                // todo.setAttribute('data-completed', !data-completed);
                App.toggleCompleted(todoId);
                todo.setAttribute('data-completed', App.getCompletedProp(todoId));
                // todo = todo.parentElement.previousElementSibling;
                // if (todo) {
                //     App.toggleCompleted(todoId);
                //     todo = todo.parentElement.previousElementSibling;
                // }
                // let parent = todo.parentElement.previousElementSibling;
                // while (parent && parent.nodeName === 'LI') {
                //     App.toggleCompleted(parent.dataset.id);
                //     parent = parent.parentElement.previousElementSibling;
                // }
                // while (todo.parentElement.previousElementSibling && todo.parentElement.previousElementSibling.nodeName === 'LI') {
                //     todo = todo.parentElement.previousElementSibling;
                //     App.toggleCompleted(todo.dataset.id);
                // }
                // todo.dataset.completed = !todo.dataset.completed;
                if (todo.dataset.completed === 'false') {
                    // run function to recursively complete false up the tree
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
            }
            if (!e.altKey && !e.shiftKey) {
                view.displayTodos();
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

        todosUl.addEventListener("dragover", function(event) {
            // prevent default to allow drop
            event.preventDefault();
            // console.log('default prevented')
        }, false);

        window.addEventListener('drop', function(e) {
            dropped = e.screenX;
            console.log('picked up at: ' + pickedUp, 'dropped at: ' + dropped, 'Distance dragged: ' + pickedUp - dropped);
            if ( (pickedUp - dropped !== NaN) && (pickedUp - dropped) > 88) {
                // console.log('accessed the function call to unnest!');
                App.unnestTotally(draggedTodo);
            } else if ( (pickedUp - dropped !== NaN) && (pickedUp - dropped <= 88 && pickedUp - dropped >= 1) ) {
                // console.log('accessed the function call to unnest!');
                App.unnestTodo(draggedTodo);
            } else if ( (dropped - pickedUp != NaN) && (dropped - pickedUp > 22) ) {
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
};

App.init();


