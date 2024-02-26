from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_bootstrap import Bootstrap

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tu_clave_secreta'
bootstrap = Bootstrap(app)

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password'] 

        if email.endswith('@cotecmar.com') and password:
            return redirect(url_for('general')) 
        else:
            flash('Email o contraseña inválidos.', 'error')
    return render_template('auth/login.html')


@app.route('/general')
def general():
    return render_template('general.html')

if __name__ == '__main__':
    app.run(debug=True)
