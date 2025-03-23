import os
import json
import uuid
import requests
import feedparser
from flask import Flask, render_template, redirect, url_for, flash, request
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_caching import Cache

# Importation des fonctions et formulaires
from data_manager import get_homepage_content, update_homepage_content
from forms import (
    HomeContentForm,
    LoginForm,
    PartnerLogoUploadForm,
    PartnerLogoEditForm,
    ProjectForm
)

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'votre_cle_secrete')

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

login_manager = LoginManager(app)
login_manager.login_view = 'login'

# ==========================================
# Données d’admin : un seul user “admin”
# ==========================================
ADMIN_USER = {
    'id': 'admin',
    'email': 'admin@example.com',  # Pour référence interne
    'password': generate_password_hash(os.environ.get('ADMIN_PWD', 'defaultpassword'))
}

class User(UserMixin):
    def __init__(self, user_id):
        self.id = user_id
        self.email = ADMIN_USER['email']

@login_manager.user_loader
def load_user(user_id):
    if user_id == ADMIN_USER['id']:
        return User(user_id)
    return None

# =================================================================
# Fonctions utilitaires (indices boursiers, news, etc.) — facultatif
# =================================================================
def get_realtime_quote(symbols):
    if isinstance(symbols, list):
        symbols = ",".join(symbols)
    url = "https://query1.finance.yahoo.com/v7/finance/quote"
    headers = {"User-Agent": "Mozilla/5.0"}
    params = {"symbols": symbols}
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200 or not response.text.strip():
            print(f"[get_realtime_quote] Erreur HTTP {response.status_code} ou réponse vide. URL: {response.url}")
            return {}
        data = response.json()
        results = {}
        for quote in data.get("quoteResponse", {}).get("result", []):
            sym = quote.get("symbol")
            price = quote.get("regularMarketPrice", "N/A")
            change_percent = quote.get("regularMarketChangePercent", "N/A")
            results[sym] = {"price": price, "change_percent": change_percent}
        return results
    except Exception as e:
        print("[get_realtime_quote] Exception:", e)
        return {}

@cache.cached(timeout=900, key_prefix='financial_indices')
def get_financial_indices():
    indices = {
        "S&P 500": "^GSPC",
        "Dow Jones": "^DJI",
        "Nasdaq": "^IXIC",
        "FTSE 100": "^FTSE",
        "Nikkei 225": "^N225",
        "CAC 40": "^FCHI"
    }
    quotes = get_realtime_quote(list(indices.values()))
    data = []
    for name, sym in indices.items():
        info = quotes.get(sym)
        if info:
            price_raw = str(info["price"]).replace(",", "")
            change_raw = str(info["change_percent"]).replace(",", "")
            try:
                price_val = float(price_raw)
                price_formatted = f"{price_val:.2f}"
            except:
                price_formatted = "N/A"
            try:
                change_val = float(change_raw.strip("%"))
                variation_formatted = f"{change_val:+.2f}%"
            except:
                variation_formatted = "N/A"
            data.append({
                "name": name,
                "points": price_formatted,
                "variation": variation_formatted
            })
        else:
            data.append({
                "name": name,
                "points": "N/A",
                "variation": "N/A"
            })
    return data

def get_financial_news():
    rss_url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^DJI&region=US&lang=en-US"
    try:
        feed = feedparser.parse(rss_url)
        if feed.entries:
            news_list = []
            for entry in feed.entries[:5]:
                title = entry.get("title", "No title")
                news_list.append(title)
            return news_list
    except Exception as e:
        print("[get_financial_news] Exception:", e)
    return []

# =================================================================
# ROUTES PRINCIPALES
# =================================================================
@app.route('/')
def index():
    raw_data = get_homepage_content() or {}
    return render_template('index.html', homepage_content=raw_data)

@app.route('/programme')
def programme():
    raw_data = get_homepage_content() or {}
    return render_template('programme.html', homepage_content=raw_data)

@app.route('/pourquoiG2C')
def pourquoi():
    raw_data = get_homepage_content() or {}
    return render_template('pourquoi.html', homepage_content=raw_data)

@app.route('/carriere')
def carriere():
    raw_data = get_homepage_content() or {}
    return render_template('carrieres.html', homepage_content=raw_data)

@app.route('/admissions')
def admissions():
    raw_data = get_homepage_content() or {}
    return render_template('admissions.html', homepage_content=raw_data)

@app.route('/contact')
def contact():
    raw_data = get_homepage_content() or {}
    return render_template('contact.html', homepage_content=raw_data)

@app.route('/wip')
def wip():
    return render_template('wip.html')


# ================================
# ROUTE : /projets (affichage front)
# ================================
@app.route('/projets')
def projets():
    raw_data = get_homepage_content() or {}
    project_section = raw_data.get("why_section", {}).get("project_section", {})
    projects_list = project_section.get("details", [])
    return render_template('projets.html',
                           homepage_content=raw_data,
                           project_section=project_section,
                           projects_list=projects_list)

# =================================================================
# SYSTÈME DE CONNEXION (PASSWORD UNIQUEMENT)
# =================================================================
@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        if check_password_hash(ADMIN_USER['password'], form.password.data):
            user = User(ADMIN_USER['id'])
            login_user(user)
            return redirect(url_for('admin'))
        else:
            flash("Mot de passe invalide.", "danger")
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

# =================================================================
# ROUTE ADMIN : GESTION DU FORMULAIRE GÉNÉRAL
# =================================================================
@app.route('/admin', methods=['GET', 'POST'])
@login_required
def admin():
    form = HomeContentForm()
    raw_data = get_homepage_content() or {}

    if form.validate_on_submit():
        # ~~~~~ 1) ACCUEIL ~~~~~
        info_section = {
            "ects": form.ects.data,
            "duration": form.duration.data,
            "institution": form.institution.data,
            "diploma": form.diploma.data,
            "capacity": form.capacity.data,
            "study_mode": form.study_mode.data
        }
        try:
            testimonials_items = json.loads(form.testimonials_json.data)
        except json.JSONDecodeError:
            flash("Le format JSON des témoignages est invalide.", "danger")
            return redirect(url_for('admin'))
        try:
            news_lines = json.loads(form.news_json.data)
        except json.JSONDecodeError:
            flash("Le format JSON des news est invalide.", "danger")
            return redirect(url_for('admin'))
        logos_list = raw_data.get("trusted_companies_section", {}).get("logos", [])

        # ~~~~~ 2) PROGRAMME ~~~~~
        programme_data = {
            "m1s1": form.m1s1_content.data,
            "m1s2": form.m1s2_content.data,
            "m2s1": form.m2s1_content.data,
            "m2s2": form.m2s2_content.data,
            "m1s1_detail": form.m1s1_detail.data,
            "m1s2_detail": form.m1s2_detail.data,
            "m2s1_detail": form.m2s1_detail.data,
            "m2s2_detail": form.m2s2_detail.data,
            "bloomberg_html": form.bloomberg_html.data,
            "cfa_html": form.cfa_html.data,
            "highlight1_title": form.highlight1_title.data,
            "highlight1_text": form.highlight1_text.data,
            "highlight1_icon": form.highlight1_icon.data,
            "highlight2_title": form.highlight2_title.data,
            "highlight2_text": form.highlight2_text.data,
            "highlight2_icon": form.highlight2_icon.data,
            "highlight3_title": form.highlight3_title.data,
            "highlight3_text": form.highlight3_text.data,
            "highlight3_icon": form.highlight3_icon.data
        }

        # ~~~~~ 3) POURQUOI G2C ~~~~~
        why_section = raw_data.get("why_section", {})
        if (form.forces_json.data or "").strip():
            try:
                forces_data = json.loads(form.forces_json.data)
            except json.JSONDecodeError:
                flash("Le format JSON des Forces du Master est invalide.", "danger")
                return redirect(url_for('admin'))
            why_section["forces"] = forces_data
        ranking_data = {
            "title": form.ranking_title.data,
            "icon": form.ranking_icon.data,
            "rank": form.ranking_rank.data,
            "subtitle": form.ranking_subtitle.data,
            "description": form.ranking_description.data,
            "button_text": form.ranking_button_text.data,
            "button_link": form.ranking_button_link.data
        }
        why_section["ranking"] = ranking_data
        key_points_data = {}
        if (form.keypoints_stats_json.data or "").strip():
            try:
                stats_array = json.loads(form.keypoints_stats_json.data)
            except json.JSONDecodeError:
                flash("Le format JSON des Key Points (Stats) est invalide.", "danger")
                return redirect(url_for('admin'))
            key_points_data["stats"] = stats_array
        if (form.keypoints_forts_json.data or "").strip():
            try:
                forts_array = json.loads(form.keypoints_forts_json.data)
            except json.JSONDecodeError:
                flash("Le format JSON des Key Points (Points Forts) est invalide.", "danger")
                return redirect(url_for('admin'))
            key_points_data["forts"] = forts_array
        why_section["key_points"] = key_points_data

        # Projets Universitaires
        project_section = why_section.get("project_section", {})
        project_section["title"] = form.projects_title.data
        project_section["text"] = form.projects_text.data
        project_section["button"] = form.projects_button.data
        try:
            projects_details = json.loads(form.projects_details.data)
        except json.JSONDecodeError:
            flash("Le format JSON des projets universitaires est invalide.", "danger")
            return redirect(url_for('admin'))
        project_section["details"] = projects_details
        why_section["project_section"] = project_section

        # Semestre à l'étranger
        semester_section = {
            "title": form.semester_title.data,
            "text": form.semester_text.data,
            "button": form.semester_button.data
        }
        why_section["semester_section"] = semester_section

        # ~~~~~ 4) ADMISSIONS ~~~~~
        try:
            phase1_details = json.loads(form.admissions_phase1_details.data)
            phase2_details = json.loads(form.admissions_phase2_details.data)
            phase3_details = json.loads(form.admissions_phase3_details.data)
            phase4_details = json.loads(form.admissions_phase4_details.data)
        except json.JSONDecodeError:
            flash("Le format JSON des détails d'une phase est invalide.", "danger")
            return redirect(url_for('admin'))
        try:
            training_cards = json.loads(form.admissions_training_cards.data)
        except json.JSONDecodeError:
            flash("Le format JSON des cartes d'entraînement est invalide.", "danger")
            return redirect(url_for('admin'))
        admissions_section = {
            "header_title": form.admissions_header_title.data,
            "header_subtitle": form.admissions_header_subtitle.data,
            "process_title": form.admissions_process_title.data,
            "phase1_title": form.admissions_phase1_title.data,
            "phase1_period": form.admissions_phase1_period.data,
            "phase1_details": phase1_details,
            "phase2_title": form.admissions_phase2_title.data,
            "phase2_period": form.admissions_phase2_period.data,
            "phase2_details": phase2_details,
            "phase3_title": form.admissions_phase3_title.data,
            "phase3_period": form.admissions_phase3_period.data,
            "phase3_details": phase3_details,
            "phase4_title": form.admissions_phase4_title.data,
            "phase4_period": form.admissions_phase4_period.data,
            "phase4_details": phase4_details,
            "requirements_title": form.admissions_requirements_title.data,
            "training_section": {
                "title": form.admissions_training_title.data,
                "cards": training_cards,
                "button_text": form.admissions_training_button_text.data,
                "button_link": form.admissions_training_button_link.data
            }
        }

        # ~~~~~ 5) CARRIÈRES ~~~~~
        try:
            jobs_json = json.loads(form.career_jobs_json.data)
        except json.JSONDecodeError:
            flash("Le format JSON des métiers (Carrières) est invalide.", "danger")
            return redirect(url_for('admin'))
        try:
            stats_json = json.loads(form.career_stats_json.data)
        except json.JSONDecodeError:
            flash("Le format JSON des statistiques (Carrières) est invalide.", "danger")
            return redirect(url_for('admin'))
        career_section = {
            "hero": {
                "title": form.career_hero_title.data,
                "subtitle": form.career_hero_subtitle.data
            },
            "jobs": {
                "title": form.career_jobs_title.data,
                "jobs": jobs_json
            },
            "stats": {
                "title": form.career_stats_title.data,
                "items": stats_json
            },
            "video": {
                "title": form.career_video_title.data,
                "youtube_url": form.career_video_url.data
            },
            "cta": {
                "title": form.career_cta_title.data,
                "description": form.career_cta_description.data,
                "button_text": form.career_cta_button_text.data,
                "button_link": form.career_cta_button_link.data
            }
        }

        # ~~~~~ 6) CONTACT ~~~~~
        try:
            info_items = json.loads(form.contact_info_json.data)
        except json.JSONDecodeError:
            flash("Le format JSON des informations de contact est invalide.", "danger")
            return redirect(url_for('admin'))
        contact_section = {
            "hero": {
                "title": form.contact_hero_title.data,
                "subtitle": form.contact_hero_subtitle.data
            },
            "form": {
                "title": form.contact_form_title.data
            },
            "info": {
                "title": form.contact_info_title.data,
                "items": info_items
            },
            "map": {
                "title": form.contact_map_title.data,
                "address": form.contact_map_address.data,
                "iframe": form.contact_map_iframe.data
            }
        }

        new_content = {
            "info_section": info_section,
            "presentation": form.presentation.data,
            "trusted_companies_section": {
                "title": form.trusted_title.data,
                "description": form.trusted_desc.data,
                "logos": logos_list
            },
            "map_section": {
                "title": form.map_title.data,
                "address": form.map_address.data
            },
            "testimonials_section": {
                "title": form.testimonials_title.data,
                "items": testimonials_items
            },
            "news_section": {
                "lines": news_lines
            },
            "programme_section": programme_data,
            "why_section": why_section,
            "admissions_section": admissions_section,
            "career_section": career_section,
            "contact_section": contact_section
        }

        if update_homepage_content(new_content):
            flash("Contenu mis à jour avec succès.", "success")
        else:
            flash("Erreur lors de la mise à jour du contenu.", "danger")

        return redirect(url_for('admin'))

    # -------------------------------------------------------------------
    # PRÉ-REMPLISSAGE DU FORMULAIRE (GET)
    # -------------------------------------------------------------------
    # 1) Accueil
    form.ects.data = raw_data.get("info_section", {}).get("ects", "")
    form.duration.data = raw_data.get("info_section", {}).get("duration", "")
    form.institution.data = raw_data.get("info_section", {}).get("institution", "")
    form.diploma.data = raw_data.get("info_section", {}).get("diploma", "")
    form.capacity.data = raw_data.get("info_section", {}).get("capacity", "")
    form.study_mode.data = raw_data.get("info_section", {}).get("study_mode", "")
    form.presentation.data = raw_data.get("presentation", "")
    form.trusted_title.data = raw_data.get("trusted_companies_section", {}).get("title", "")
    form.trusted_desc.data = raw_data.get("trusted_companies_section", {}).get("description", "")
    form.map_title.data = raw_data.get("map_section", {}).get("title", "")
    form.map_address.data = raw_data.get("map_section", {}).get("address", "")
    form.testimonials_title.data = raw_data.get("testimonials_section", {}).get("title", "")
    form.testimonials_json.data = json.dumps(raw_data.get("testimonials_section", {}).get("items", []), indent=2, ensure_ascii=False)
    form.news_json.data = json.dumps(raw_data.get("news_section", {}).get("lines", []), indent=2, ensure_ascii=False)

    # 2) Programme
    programme_data = raw_data.get("programme_section", {})
    form.m1s1_content.data = programme_data.get("m1s1", "")
    form.m1s2_content.data = programme_data.get("m1s2", "")
    form.m2s1_content.data = programme_data.get("m2s1", "")
    form.m2s2_content.data = programme_data.get("m2s2", "")
    form.m1s1_detail.data = programme_data.get("m1s1_detail", "")
    form.m1s2_detail.data = programme_data.get("m1s2_detail", "")
    form.m2s1_detail.data = programme_data.get("m2s1_detail", "")
    form.m2s2_detail.data = programme_data.get("m2s2_detail", "")
    form.bloomberg_html.data = programme_data.get("bloomberg_html", "")
    form.cfa_html.data = programme_data.get("cfa_html", "")
    form.highlight1_title.data = programme_data.get("highlight1_title", "")
    form.highlight1_text.data  = programme_data.get("highlight1_text", "")
    form.highlight1_icon.data  = programme_data.get("highlight1_icon", "")
    form.highlight2_title.data = programme_data.get("highlight2_title", "")
    form.highlight2_text.data  = programme_data.get("highlight2_text", "")
    form.highlight2_icon.data  = programme_data.get("highlight2_icon", "")
    form.highlight3_title.data = programme_data.get("highlight3_title", "")
    form.highlight3_text.data  = programme_data.get("highlight3_text", "")
    form.highlight3_icon.data  = programme_data.get("highlight3_icon", "")

    # 3) Pourquoi G2C
    why_section = raw_data.get("why_section", {})
    forces_data = why_section.get("forces", [])
    form.forces_json.data = json.dumps(forces_data, indent=2, ensure_ascii=False)
    ranking_data = why_section.get("ranking", {})
    form.ranking_title.data       = ranking_data.get("title", "")
    form.ranking_icon.data        = ranking_data.get("icon", "")
    form.ranking_rank.data        = ranking_data.get("rank", "")
    form.ranking_subtitle.data    = ranking_data.get("subtitle", "")
    form.ranking_description.data = ranking_data.get("description", "")
    form.ranking_button_text.data = ranking_data.get("button_text", "")
    form.ranking_button_link.data = ranking_data.get("button_link", "")
    key_points = why_section.get("key_points", {})
    stats_array = key_points.get("stats", [])
    forts_array = key_points.get("forts", [])
    form.keypoints_stats_json.data = json.dumps(stats_array, indent=2, ensure_ascii=False)
    form.keypoints_forts_json.data = json.dumps(forts_array, indent=2, ensure_ascii=False)
    project_data = why_section.get("project_section", {})
    form.projects_title.data  = project_data.get("title", "")
    form.projects_text.data   = project_data.get("text", "")
    form.projects_button.data = project_data.get("button", "")
    form.projects_details.data = json.dumps(project_data.get("details", []), indent=2, ensure_ascii=False)

    # 4) Admissions
    admissions_data = raw_data.get("admissions_section", {})
    form.admissions_header_title.data = admissions_data.get("header_title", "")
    form.admissions_header_subtitle.data = admissions_data.get("header_subtitle", "")
    form.admissions_process_title.data = admissions_data.get("process_title", "")
    form.admissions_phase1_title.data = admissions_data.get("phase1_title", "")
    form.admissions_phase1_period.data = admissions_data.get("phase1_period", "")
    form.admissions_phase1_details.data = json.dumps(admissions_data.get("phase1_details", []), indent=2, ensure_ascii=False)
    form.admissions_phase2_title.data = admissions_data.get("phase2_title", "")
    form.admissions_phase2_period.data = admissions_data.get("phase2_period", "")
    form.admissions_phase2_details.data = json.dumps(admissions_data.get("phase2_details", []), indent=2, ensure_ascii=False)
    form.admissions_phase3_title.data = admissions_data.get("phase3_title", "")
    form.admissions_phase3_period.data = admissions_data.get("phase3_period", "")
    form.admissions_phase3_details.data = json.dumps(admissions_data.get("phase3_details", []), indent=2, ensure_ascii=False)
    form.admissions_phase4_title.data = admissions_data.get("phase4_title", "")
    form.admissions_phase4_period.data = admissions_data.get("phase4_period", "")
    form.admissions_phase4_details.data = json.dumps(admissions_data.get("phase4_details", []), indent=2, ensure_ascii=False)
    form.admissions_requirements_title.data = admissions_data.get("requirements_title", "")
    training_data = admissions_data.get("training_section", {})
    form.admissions_training_title.data = training_data.get("title", "")
    form.admissions_training_cards.data = json.dumps(training_data.get("cards", []), indent=2, ensure_ascii=False)
    form.admissions_training_button_text.data = training_data.get("button_text", "")
    form.admissions_training_button_link.data = training_data.get("button_link", "")

    # 5) Carrières
    career_data = raw_data.get("career_section", {})
    hero_data = career_data.get("hero", {})
    form.career_hero_title.data = hero_data.get("title", "")
    form.career_hero_subtitle.data = hero_data.get("subtitle", "")
    jobs_data = career_data.get("jobs", {})
    form.career_jobs_title.data = jobs_data.get("title", "")
    form.career_jobs_json.data = json.dumps(jobs_data.get("jobs", []), indent=2, ensure_ascii=False)
    stats_data = career_data.get("stats", {})
    form.career_stats_title.data = stats_data.get("title", "")
    form.career_stats_json.data = json.dumps(stats_data.get("items", []), indent=2, ensure_ascii=False)
    video_data = career_data.get("video", {})
    form.career_video_title.data = video_data.get("title", "")
    form.career_video_url.data = video_data.get("youtube_url", "")
    cta_data = career_data.get("cta", {})
    form.career_cta_title.data = cta_data.get("title", "")
    form.career_cta_description.data = cta_data.get("description", "")
    form.career_cta_button_text.data = cta_data.get("button_text", "")
    form.career_cta_button_link.data = cta_data.get("button_link", "")

    # 6) Contact
    contact_data = raw_data.get("contact_section", {})
    hero_contact = contact_data.get("hero", {})
    form.contact_hero_title.data = hero_contact.get("title", "")
    form.contact_hero_subtitle.data = hero_contact.get("subtitle", "")
    form_contact = contact_data.get("form", {})
    form.contact_form_title.data = form_contact.get("title", "")
    info_contact = contact_data.get("info", {})
    form.contact_info_title.data = info_contact.get("title", "")
    form.contact_info_json.data = json.dumps(info_contact.get("items", []), indent=2, ensure_ascii=False)
    map_contact = contact_data.get("map", {})
    form.contact_map_title.data = map_contact.get("title", "")
    form.contact_map_address.data = map_contact.get("address", "")
    form.contact_map_iframe.data = map_contact.get("iframe", "")

    return render_template('admin.html', form=form)

# =================================================================
# ROUTES DE GESTION DES LOGOS
# =================================================================
@app.route('/admin/logos', methods=['GET', 'POST'])
@login_required
def admin_logos():
    form = PartnerLogoUploadForm()
    raw_data = get_homepage_content() or {}
    logos_list = raw_data.get("trusted_companies_section", {}).get("logos", [])

    if form.validate_on_submit():
        file = form.file.data
        alt_text = form.alt.data
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        secure_name = secure_filename(unique_filename)
        save_path = os.path.join("static", "media", secure_name)
        file.save(save_path)
        logo_id = str(uuid.uuid4())
        new_logo = {
            "id": logo_id,
            "filename": secure_name,
            "alt": alt_text
        }
        logos_list.append(new_logo)
        raw_data.setdefault("trusted_companies_section", {})["logos"] = logos_list
        if update_homepage_content(raw_data):
            flash("Logo ajouté avec succès.", "success")
        else:
            flash("Erreur lors de la mise à jour du contenu.", "danger")
        return redirect(url_for('admin_logos'))
    return render_template("admin_logos.html", form=form, logos=logos_list)

@app.route('/admin/logos/edit/<logo_id>', methods=['GET', 'POST'])
@login_required
def edit_logo(logo_id):
    form = PartnerLogoEditForm()
    raw_data = get_homepage_content() or {}
    logos_list = raw_data.get("trusted_companies_section", {}).get("logos", [])
    logo = next((l for l in logos_list if l.get("id") == logo_id), None)
    if not logo:
        flash("Logo introuvable.", "danger")
        return redirect(url_for('admin_logos'))
    if request.method == 'GET':
        form.alt.data = logo["alt"]
    if form.validate_on_submit():
        logo["alt"] = form.alt.data
        if form.file.data:
            file = form.file.data
            ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{ext}"
            secure_name = secure_filename(unique_filename)
            save_path = os.path.join("static", "media", secure_name)
            file.save(save_path)
            old_filename = logo["filename"]
            old_path = os.path.join("static", "media", old_filename)
            if os.path.exists(old_path):
                os.remove(old_path)
            logo["filename"] = secure_name
        raw_data["trusted_companies_section"]["logos"] = logos_list
        if update_homepage_content(raw_data):
            flash("Logo mis à jour avec succès.", "success")
        else:
            flash("Erreur lors de la mise à jour du contenu.", "danger")
        return redirect(url_for('admin_logos'))
    return render_template("edit_logo.html", form=form, logo=logo)

@app.route('/admin/logos/delete/<logo_id>', methods=['POST'])
@login_required
def delete_logo(logo_id):
    raw_data = get_homepage_content() or {}
    logos_list = raw_data.get("trusted_companies_section", {}).get("logos", [])
    index = next((i for i, l in enumerate(logos_list) if l.get("id") == logo_id), None)
    if index is None:
        flash("Logo introuvable.", "danger")
        return redirect(url_for('admin_logos'))
    filename_to_delete = logos_list[index]["filename"]
    file_path = os.path.join("static", "media", filename_to_delete)
    if os.path.exists(file_path):
        os.remove(file_path)
    logos_list.pop(index)
    raw_data["trusted_companies_section"]["logos"] = logos_list
    if update_homepage_content(raw_data):
        flash("Logo supprimé avec succès.", "success")
    else:
        flash("Erreur lors de la mise à jour du contenu.", "danger")
    return redirect(url_for('admin_logos'))

# =================================================================
# ROUTES DE GESTION DES PROJETS (CRUD)
# =================================================================
@app.route('/admin/projects', methods=['GET'])
@login_required
def admin_projects():
    raw_data = get_homepage_content() or {}
    projects = raw_data.get("why_section", {}).get("project_section", {}).get("details", [])
    return render_template("admin_projects.html", projects=projects)

@app.route('/admin/projects/new', methods=['GET', 'POST'])
@login_required
def new_project():
    form = ProjectForm()
    raw_data = get_homepage_content() or {}
    projects = raw_data.get("why_section", {}).get("project_section", {}).get("details", [])
    if form.validate_on_submit():
        # Traitement des images (jusqu'à 5)
        images = []
        for field in [form.image1, form.image2, form.image3, form.image4, form.image5]:
            if field.data:
                ext = os.path.splitext(field.data.filename)[1]
                unique_filename = f"{uuid.uuid4()}{ext}"
                secure_name = secure_filename(unique_filename)
                save_path = os.path.join("static", "media", secure_name)
                field.data.save(save_path)
                images.append(secure_name)
        # Traitement des étudiants (max 3)
        students = []
        if form.student1_name.data:
            student = {"name": form.student1_name.data}
            if form.student1_photo.data:
                ext = os.path.splitext(form.student1_photo.data.filename)[1]
                unique_filename = f"{uuid.uuid4()}{ext}"
                secure_name = secure_filename(unique_filename)
                save_path = os.path.join("static", "media", secure_name)
                form.student1_photo.data.save(save_path)
                student["photo"] = secure_name
            if form.student1_linkedin.data:
                student["linkedin"] = form.student1_linkedin.data
            students.append(student)
        if form.student2_name.data:
            student = {"name": form.student2_name.data}
            if form.student2_photo.data:
                ext = os.path.splitext(form.student2_photo.data.filename)[1]
                unique_filename = f"{uuid.uuid4()}{ext}"
                secure_name = secure_filename(unique_filename)
                save_path = os.path.join("static", "media", secure_name)
                form.student2_photo.data.save(save_path)
                student["photo"] = secure_name
            if form.student2_linkedin.data:
                student["linkedin"] = form.student2_linkedin.data
            students.append(student)
        if form.student3_name.data:
            student = {"name": form.student3_name.data}
            if form.student3_photo.data:
                ext = os.path.splitext(form.student3_photo.data.filename)[1]
                unique_filename = f"{uuid.uuid4()}{ext}"
                secure_name = secure_filename(unique_filename)
                save_path = os.path.join("static", "media", secure_name)
                form.student3_photo.data.save(save_path)
                student["photo"] = secure_name
            if form.student3_linkedin.data:
                student["linkedin"] = form.student3_linkedin.data
            students.append(student)
        new_proj = {
            "id": str(uuid.uuid4()),
            "year": form.year.data,
            "title": form.title.data,
            "description": form.description.data,
            "link": form.link.data,
            "images": images,
            "students": students
        }
        projects.append(new_proj)
        raw_data.setdefault("why_section", {}).setdefault("project_section", {})["details"] = projects
        if update_homepage_content(raw_data):
            flash("Projet ajouté avec succès.", "success")
            return redirect(url_for('admin_projects'))
        else:
            flash("Erreur lors de la mise à jour du contenu.", "danger")
    return render_template("edit_project.html", form=form, action="new")

@app.route('/admin/projects/edit/<proj_id>', methods=['GET', 'POST'])
@login_required
def edit_project(proj_id):
    form = ProjectForm()
    raw_data = get_homepage_content() or {}
    projects = raw_data.get("why_section", {}).get("project_section", {}).get("details", [])
    project = next((p for p in projects if p["id"] == proj_id), None)
    if not project:
        flash("Projet introuvable.", "danger")
        return redirect(url_for('admin_projects'))
    if request.method == 'GET':
        form.year.data = project.get("year", "")
        form.title.data = project.get("title", "")
        form.description.data = project.get("description", "")
        form.link.data = project.get("link", "")
        # Pré-remplissage pour les étudiants (texte uniquement)
        old_students = project.get("students", [])
        if len(old_students) >= 1:
            form.student1_name.data = old_students[0].get("name", "")
            form.student1_linkedin.data = old_students[0].get("linkedin", "")
        if len(old_students) >= 2:
            form.student2_name.data = old_students[1].get("name", "")
            form.student2_linkedin.data = old_students[1].get("linkedin", "")
        if len(old_students) >= 3:
            form.student3_name.data = old_students[2].get("name", "")
            form.student3_linkedin.data = old_students[2].get("linkedin", "")
    if form.validate_on_submit():
        # Traitement des images
        images = project.get("images", [])
        for idx, field in enumerate([form.image1, form.image2, form.image3, form.image4, form.image5]):
            if field.data:
                ext = os.path.splitext(field.data.filename)[1]
                unique_filename = f"{uuid.uuid4()}{ext}"
                secure_name = secure_filename(unique_filename)
                save_path = os.path.join("static", "media", secure_name)
                field.data.save(save_path)
                if idx < len(images) and images[idx]:
                    old_path = os.path.join("static", "media", images[idx])
                    if os.path.exists(old_path):
                        os.remove(old_path)
                    images[idx] = secure_name
                else:
                    images.append(secure_name)
        # Traitement des étudiants
        old_students = project.get("students", [])
        new_students = []
        for i in range(1, 4):
            name_field = getattr(form, f"student{i}_name")
            photo_field = getattr(form, f"student{i}_photo")
            linkedin_field = getattr(form, f"student{i}_linkedin")
            if name_field.data:
                student = {"name": name_field.data}
                if photo_field.data:
                    ext = os.path.splitext(photo_field.data.filename)[1]
                    unique_filename = f"{uuid.uuid4()}{ext}"
                    secure_name = secure_filename(unique_filename)
                    save_path = os.path.join("static", "media", secure_name)
                    photo_field.data.save(save_path)
                    if (i-1) < len(old_students) and old_students[i-1].get("photo"):
                        old_path = os.path.join("static", "media", old_students[i-1]["photo"])
                        if os.path.exists(old_path):
                            os.remove(old_path)
                    student["photo"] = secure_name
                else:
                    if (i-1) < len(old_students) and old_students[i-1].get("photo"):
                        student["photo"] = old_students[i-1]["photo"]
                if linkedin_field.data:
                    student["linkedin"] = linkedin_field.data
                new_students.append(student)
        project["students"] = new_students
        project["year"] = form.year.data
        project["title"] = form.title.data
        project["description"] = form.description.data
        project["link"] = form.link.data
        project["images"] = images
        if update_homepage_content(raw_data):
            flash("Projet modifié avec succès.", "success")
        else:
            flash("Erreur lors de la mise à jour du contenu.", "danger")
        return redirect(url_for('admin_projects'))
    return render_template("edit_project.html", form=form, action="edit", project=project)

@app.route('/admin/projects/delete/<proj_id>', methods=['POST'])
@login_required
def delete_project(proj_id):
    raw_data = get_homepage_content() or {}
    projects = raw_data.get("why_section", {}).get("project_section", {}).get("details", [])
    index = next((i for i, p in enumerate(projects) if p["id"] == proj_id), None)
    if index is None:
        flash("Projet introuvable.", "danger")
        return redirect(url_for('admin_projects'))
    for img in projects[index].get("images", []):
        file_path = os.path.join("static", "media", img)
        if os.path.exists(file_path):
            os.remove(file_path)
    for st in projects[index].get("students", []):
        if st.get("photo"):
            file_path = os.path.join("static", "media", st["photo"])
            if os.path.exists(file_path):
                os.remove(file_path)
    projects.pop(index)
    raw_data.setdefault("why_section", {}).setdefault("project_section", {})["details"] = projects
    if update_homepage_content(raw_data):
        flash("Projet supprimé avec succès.", "success")
    else:
        flash("Erreur lors de la mise à jour du contenu.", "danger")
    return redirect(url_for('admin_projects'))

# =================================================================
# Lancement de l’application
# =================================================================
if __name__ == '__main__':
    app.run(debug=True)
