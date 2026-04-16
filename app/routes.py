from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from flask_login import login_required, current_user

bp = Blueprint('main', __name__)


@bp.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return redirect(url_for('auth.login'))


@bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', username=current_user.username)

# API Routes
@bp.route('/api/transactions', methods=['GET'])
@login_required
def get_transactions():
    transactions = current_user.get_transactions()
    balance = current_user.get_balance()
    return jsonify({
        'transactions': transactions,
        'balance': balance
    })


@bp.route('/api/transactions', methods=['POST'])
@login_required
def add_transaction():
    data = request.get_json()
    
    transaction_type = data.get('type')
    amount = data.get('amount')
    description = data.get('description')
    category = data.get('category')
    
    if not all([transaction_type, amount, description, category]):
        return jsonify({'error': 'All fields are required'}), 400
    
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400
    
    transaction = current_user.add_transaction(
        transaction_type, amount, description, category
    )
    
    balance = current_user.get_balance()
    
    return jsonify({
        'success': True,
        'transaction': transaction,
        'balance': balance
    })


@bp.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
@login_required
def delete_transaction(transaction_id):
    current_user.delete_transaction(transaction_id)
    balance = current_user.get_balance()
    return jsonify({
        'success': True,
        'balance': balance
    })

@bp.route('/api/summary', methods=['GET'])
@login_required
def get_summary():
    balance = current_user.get_balance()
    transactions = current_user.get_transactions()
    
    # Make a simple breakdown of income and expense per category.
    category_breakdown = {}
    for transaction in transactions:
        category = transaction['category']
        if category not in category_breakdown:
            category_breakdown[category] = {'income': 0, 'expense': 0}
        category_breakdown[category][transaction['type']] += transaction['amount']
    
    return jsonify({
        'balance': balance,
        'category_breakdown': category_breakdown,
        'total_transactions': len(transactions)
    })