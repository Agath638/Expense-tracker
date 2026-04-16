// Expense Tracker Application Logic
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard if on dashboard page
    if (document.getElementById('transaction-form')) {
        initializeDashboard();
    }
});

function initializeDashboard() {
    loadTransactions();
    
    // Form submission handler
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', handleFormSubmit);
}

// Load all transactions from API
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        const data = await response.json();
        
        updateSummaryCards(data.balance);
        renderTransactions(data.transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
        showNotification('Error loading transactions', 'error');
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        type: document.getElementById('type').value,
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value
    };
    
    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Clear form
            document.getElementById('amount').value = '';
            document.getElementById('description').value = '';
            
            // Update UI
            updateSummaryCards(data.balance);
            renderTransactions(data.transaction, true);
            showNotification('Transaction added successfully!', 'success');
        } else {
            showNotification(data.error || 'Error adding transaction', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error adding transaction', 'error');
    }
}

// Update summary cards with balance data
function updateSummaryCards(balance) {
    document.getElementById('balance-amount').textContent = formatCurrency(balance.balance);
    document.getElementById('income-amount').textContent = formatCurrency(balance.income);
    document.getElementById('expense-amount').textContent = formatCurrency(balance.expense);
}

// Render transactions list
function renderTransactions(transactions, append = false) {
    const container = document.getElementById('transactions-list');
    
    // If it's a single transaction (from add), convert to array
    if (!Array.isArray(transactions)) {
        transactions = [transactions];
    }
    
    // If not appending, clear container (unless it's the initial load with empty array)
    if (!append && transactions.length === 0) {
        container.innerHTML = '<p class="no-transactions">No transactions yet. Add your first transaction above!</p>';
        return;
    }
    
    // If initial load, clear container
    if (!append) {
        container.innerHTML = '';
    }
    
    transactions.forEach(transaction => {
        const transactionEl = createTransactionElement(transaction);
        
        if (append) {
            // Remove "no transactions" message if exists
            const noTransMsg = container.querySelector('.no-transactions');
            if (noTransMsg) noTransMsg.remove();
            
            // Add to top
            container.insertBefore(transactionEl, container.firstChild);
        } else {
            container.appendChild(transactionEl);
        }
    });
}

// Create transaction HTML element
function createTransactionElement(transaction) {
    const div = document.createElement('div');
    div.className = `transaction-item ${transaction.type}`;
    div.dataset.id = transaction.id;
    
    const amountClass = transaction.type;
    const sign = transaction.type === 'income' ? '+' : '-';
    
    div.innerHTML = `
        <div class="transaction-info">
            <h4>${escapeHtml(transaction.description)}</h4>
            <div class="transaction-meta">
                <span class="category">${formatCategory(transaction.category)}</span>
                <span class="date">${formatDate(transaction.date)}</span>
            </div>
        </div>
        <div class="transaction-amount ${amountClass}">
            ${sign}${formatCurrency(transaction.amount)}
        </div>
        <button class="btn-delete" onclick="deleteTransaction(${transaction.id})">Delete</button>
    `;
    
    return div;
}

// Delete transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Remove from DOM
            const element = document.querySelector(`.transaction-item[data-id="${id}"]`);
            if (element) {
                element.remove();
            }
            
            // Update summary
            updateSummaryCards(data.balance);
            
            // Check if no transactions left
            const container = document.getElementById('transactions-list');
            if (container.children.length === 0) {
                container.innerHTML = '<p class="no-transactions">No transactions yet. Add your first transaction above!</p>';
            }
            
            showNotification('Transaction deleted successfully!', 'success');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showNotification('Error deleting transaction', 'error');
    }
}
// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }).format(amount);
}
function formatCategory(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideIn 0.3s ease';

    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);