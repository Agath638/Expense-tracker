from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime

# In-memory storage
users = {}           # {username: User object}
transactions_db = {}  # {username: [list of transactions]}


class User(UserMixin):
    def __init__(self, username, password):
        self.id = username
        self.username = username
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_transactions(self):
        return transactions_db.get(self.username, [])
    
    def add_transaction(self, transaction_type, amount, description, category):
        if self.username not in transactions_db:
            transactions_db[self.username] = []
        
        transaction = {
            'id': len(transactions_db[self.username]) + 1,
            'type': transaction_type,
            'amount': float(amount),
            'description': description,
            'category': category,
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        transactions_db[self.username].append(transaction)
        return transaction
    
    def delete_transaction(self, transaction_id):
        if self.username in transactions_db:
            transactions_db[self.username] = [
                t for t in transactions_db[self.username] 
                if t['id'] != transaction_id
            ]
    
    def get_balance(self):
        transactions = self.get_transactions()
        income = sum(t['amount'] for t in transactions if t['type'] == 'income')
        expense = sum(t['amount'] for t in transactions if t['type'] == 'expense')
        return {
            'income': income,
            'expense': expense,
            'balance': income - expense
        }


def get_user(username):
    return users.get(username)


def create_user(username, password):
    if username in users:
        return None
    user = User(username, password)
    users[username] = user
    transactions_db[username] = []
    return user