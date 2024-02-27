function createTransactionContainer(id) {
  const container = document.createElement('div')
  container.classList.add('transaction')
  container.id = `transaction-${id}`
  return container
}

function createTransactionTitle(name) {
  const title = document.createElement('span')
  title.classList.add('transaction-title')
  title.textContent = name
  return title
}

function createTransactionAmount(amount) {
  const span = document.createElement('span')
  span.classList.add('transaction-amount')
  const formater = Intl.NumberFormat('pt-BR', {
    compactDisplay: 'long',
    currency: 'BRL',
    style: 'currency',
  })
  const formatedAmount = formater.format(amount)
  if (amount > 0) {
    span.textContent = `${formatedAmount} C`
    span.classList.add('transaction-amount', 'credit')
  } else {
    span.textContent = `${formatedAmount} D`
    span.classList.add('transaction-amount', 'debit')
  }
  return span
}

function renderTransaction(transaction) {
  const container = createTransactionContainer(transaction.id)
  const title = createTransactionTitle(transaction.name)
  const amount = createTransactionAmount(transaction.amount)
  const editBtn = createEditTransactionBtn(transaction)
  const deleteBtn = createDeleteTransactionButton(transaction.id)

  document.querySelector('#transactions').append(container)
  container.append(title, amount, editBtn, deleteBtn)
}

async function fetchTransactions() {
  return await fetch('https://api-storage.vercel.app/transactions').then(res => res.json())
}

let transactions = []

function updateBalance() {
  const balanceSpan = document.querySelector('#balance')
  const balance = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  const formater = Intl.NumberFormat('pt-BR', {
    compactDisplay: 'long',
    currency: 'BRL',
    style: 'currency'
  })
  balanceSpan.textContent = formater.format(balance)
}

async function setup() {
  const results = await fetchTransactions()
  transactions.push(...results)
  transactions.forEach(renderTransaction)
  updateBalance()
}

document.addEventListener('DOMContentLoaded', setup)

// async function saveTransaction(ev) {
//   ev.preventDefault()

//   const name = document.querySelector('#name').value
//   const amount = parseFloat(document.querySelector('#amount').value)

//   const response = await fetch('http://localhost:3000/transactions', {
//     method: 'POST',
//     body: JSON.stringify({ name, amount }),
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   })

//   const transaction = await response.json()
//   transactions.push(transaction)
//   renderTransaction(transaction)

//   ev.target.reset()
//   updateBalance()         Essa função foi atualizada, está mais abaixo nesse código !
// }

document.addEventListener('DOMContentLoaded', setup)
document.querySelector('form').addEventListener('submit', saveTransaction)


function createEditTransactionBtn(transaction) {
  const editBtn = document.createElement('button')
  editBtn.classList.add('edit-btn')
  editBtn.textContent = 'Editar'
  editBtn.addEventListener('click', () => {
    document.querySelector('#id').value = transaction.id
    document.querySelector('#name').value = transaction.name
    document.querySelector('#amount').value = transaction.amount
  })
  return editBtn
}

async function saveTransaction(ev) {
  ev.preventDefault()

  const id = document.querySelector('#id').value
  const name = document.querySelector('#name').value
  const amount = parseFloat(document.querySelector('#amount').value)

  if (id) {
    // Quando tiver o id, ele irá editar essa transação !
    const response = await fetch(`https://api-storage.vercel.app/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, amount }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) { // Verifica se a resposta foi bem sucedida
      const transaction = await response.json();
      // Essas próximas 4 linhas, servem para remover o elemento que ficou desatualizado !
      const indexToRemove = transactions.findIndex((t) => t.id === id);
      transactions.splice(indexToRemove, 1, transaction); // O splice permite remover o antigo e incluir o novo !
      document.querySelector(`#transaction-${id}`).remove(); // removendo o container pelo id !
      renderTransaction(transaction);
    }

  } else {
    // Quando não tiver o id, ele vai criar uma nova transação
    const response = await fetch('https://api-storage.vercel.app/transactions', {
      method: 'POST',
      body: JSON.stringify({ name, amount }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const transaction = await response.json()
    transactions.push(transaction)
    renderTransaction(transaction)
    // console.log(transactions) // Pode retirar esse console.log, mas eu deixei para ver no console, funciona apenas quando não tiver o id (editando), ou seja, criando uma transação nova !
  }

  ev.target.reset()
  updateBalance()
}

function createDeleteTransactionButton(id) {
  const deleteBtn = document.createElement('button')
  deleteBtn.classList.add('delete-btn')
  deleteBtn.textContent = 'Excluir'
  deleteBtn.addEventListener('click', async () => {
    await fetch(`https://api-storage.vercel.app/transactions/${id}`, { method: 'DELETE' }) // Acho que deleta do banco de dados, no caso o db.json !
    deleteBtn.parentElement.remove() // Vai excluir o container/div da tela (o container é o parente) !
    const indexToRemove = transactions.findIndex((t) => t.id === id) // Pega o índice no array de transactions do elemento a ser excluído !
    transactions.splice(indexToRemove, 1) // Exclui um elemento desse array
    updateBalance() // Atualiza o saldo
    // Ou seja, exclui da tela, do banco de dados e do array !
  })
  return deleteBtn // Muito importante retorna ele na função para funcionar !
}

// Código criado para rodar melhor na vercel, com um refresh de página melhor:

async function setup() {
  await renderTransactions();
  startAutoRefresh(); // Inicia a atualização automática
}

function startAutoRefresh() {
  setInterval(renderTransactions, 1000); // Renderiza as transações a cada 5 segundos
}

async function renderTransactions() {
  const results = await fetchTransactions();
  transactions = results;
  document.querySelector('#transactions').innerHTML = ''; // Limpa o conteúdo antes de renderizar novamente
  transactions.forEach(renderTransaction);
  updateBalance();
}

/* Código criado para rodar melhor na vercel, com armazenamento temporário em cache para desafogar
o servidor: */

let cachedTransactions = []; // Array para armazenar temporariamente as transações em cache

async function fetchTransactions() {
  const response = await fetch('https://api-storage.vercel.app/transactions');
  const transactions = await response.json();

  // Atualiza o cache apenas se os dados forem diferentes
  if (!arraysAreEqual(cachedTransactions, transactions)) {
    cachedTransactions = transactions;
  }

  return cachedTransactions;
}

// Função para verificar se dois arrays são iguais
function arraysAreEqual(array1, array2) {
  if (array1.length !== array2.length) {
    return false;
  }
  
  for (let i = 0; i < array1.length; i++) {
    if (JSON.stringify(array1[i]) !== JSON.stringify(array2[i])) {
      return false;
    }
  }
  
  return true;
}

// Função para renderizar as transações a partir do cache
async function renderTransactionsFromCache() {
  const transactions = await fetchTransactions();
  document.querySelector('#transactions').innerHTML = ''; // Limpa o conteúdo antes de renderizar novamente
  transactions.forEach(renderTransaction);
  updateBalance();
}

// Função para iniciar a atualização automática usando o cache
function startAutoRefreshWithCache() {
  setInterval(renderTransactionsFromCache, 1000); // Renderiza as transações a cada 5 segundos
}

// Posso aprimorar tratando erros, fazer testes/verificações na hora de enviar o resultado do formulário (essa requisição), posso utilizar classes (ter uma classe transaction) !