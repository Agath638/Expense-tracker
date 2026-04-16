from pathlib import Path
from flask import Flask
from flask_login import LoginManager
from config import Config

login_manager = LoginManager()
def create_app():
    # Set the project root so Flask can find templates and static files.
    project_root = Path(__file__).resolve().parent.parent
    app = Flask(
        __name__,
        template_folder=str(project_root / 'templates'),
        static_folder=str(project_root / 'static')
    )
    app.config.from_object(Config)

    # Initialize extensions
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    # Register blueprints
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from app.routes import bp as main_bp
    app.register_blueprint(main_bp)

    @login_manager.user_loader
    def load_user(username):
        from app.models import users
        return users.get(username)

    return app
