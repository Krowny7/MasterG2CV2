"""
==========================================================================
TABLE DES MATIÈRES - forms.py
==========================================================================
I. FORMULAIRE DE CONTENU DE LA PAGE D'ACCUEIL
II. FORMULAIRE DE CONNEXION
III. FORMULAIRES DE GESTION DES LOGOS PARTENAIRES
IV. POURQUOI G2C, ADMISSIONS, CARRIÈRES, CONTACT
V. GESTION DES PROJETS (CRUD) - ProjectForm
==========================================================================
"""

from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField, PasswordField
from flask_wtf.file import FileField, FileAllowed
from wtforms.validators import DataRequired, Length

# --- 1. FORMULAIRE DE CONTENU DE LA PAGE D'ACCUEIL ---
class HomeContentForm(FlaskForm):
    # Section Info (Accueil)
    ects = StringField("ECTS", validators=[DataRequired()])
    duration = StringField("Durée", validators=[DataRequired()])
    institution = StringField("Institution", validators=[DataRequired()])
    diploma = StringField("Diplôme", validators=[DataRequired()])
    capacity = StringField("Capacité d'accueil", validators=[DataRequired()])
    study_mode = StringField("Régime d'étude", validators=[DataRequired()])

    # Présentation
    presentation = TextAreaField("Présentation du Master", validators=[DataRequired(), Length(max=2000)])

    # Entreprises
    trusted_title = StringField("Titre - Entreprises", validators=[DataRequired()])
    trusted_desc = TextAreaField("Description - Entreprises", validators=[DataRequired()])

    # Localisation
    map_title = StringField("Titre - Localisation", validators=[DataRequired()])
    map_address = StringField("Adresse", validators=[DataRequired()])

    # Témoignages
    testimonials_title = StringField("Titre - Témoignages", validators=[DataRequired()])
    testimonials_json = TextAreaField("Témoignages (format JSON)", validators=[DataRequired()])

    # News
    news_json = TextAreaField("News (format JSON)", validators=[DataRequired()])

    # 2. PROGRAMME
    m1s1_content = TextAreaField("M1 - S1 (timeline)")
    m1s2_content = TextAreaField("M1 - S2 (timeline)")
    m2s1_content = TextAreaField("M2 - S1 (timeline)")
    m2s2_content = TextAreaField("M2 - S2 (timeline)")

    m1s1_detail = TextAreaField("M1 - S1 (détails)")
    m1s2_detail = TextAreaField("M1 - S2 (détails)")
    m2s1_detail = TextAreaField("M2 - S1 (détails)")
    m2s2_detail = TextAreaField("M2 - S2 (détails)")

    bloomberg_html = TextAreaField("Partenariat Bloomberg (HTML)")
    cfa_html = TextAreaField("Programme partenaire CFA (HTML)")

    highlight1_title = StringField("Points forts #1 - Titre")
    highlight1_text  = TextAreaField("Points forts #1 - Texte")
    highlight1_icon  = StringField("Points forts #1 - Icône")

    highlight2_title = StringField("Points forts #2 - Titre")
    highlight2_text  = TextAreaField("Points forts #2 - Texte")
    highlight2_icon  = StringField("Points forts #2 - Icône")

    highlight3_title = StringField("Points forts #3 - Titre")
    highlight3_text  = TextAreaField("Points forts #3 - Texte")
    highlight3_icon  = StringField("Points forts #3 - Icône")

    # 3. POURQUOI G2C
    forces_json = TextAreaField("Forces du Master (JSON)")
    ranking_title       = StringField("Classement - Titre")
    ranking_icon        = StringField("Classement - Icône")
    ranking_rank        = StringField("Classement - Rang")
    ranking_subtitle    = StringField("Classement - Sous-titre")
    ranking_description = TextAreaField("Classement - Description")
    ranking_button_text = StringField("Classement - Bouton (texte)")
    ranking_button_link = StringField("Classement - Bouton (lien)")

    keypoints_stats_json = TextAreaField("Key Points - Stats (JSON)")
    keypoints_forts_json = TextAreaField("Key Points - Points Forts (JSON)")

    # Projets
    projects_title  = StringField("Projets Universitaires - Titre")
    projects_text   = TextAreaField("Projets Universitaires - Texte")
    projects_button = StringField("Projets Universitaires - Bouton")
    projects_details = TextAreaField("Projets Universitaires - Détails (JSON)")

    # Semestre à l'étranger
    semester_title  = StringField("Semestre à l'étranger - Titre")
    semester_text   = TextAreaField("Semestre à l'étranger - Texte")
    semester_button = StringField("Semestre à l'étranger - Bouton")

    # 4. ADMISSIONS
    admissions_header_title = StringField("Admissions - Titre de l'en-tête", validators=[DataRequired()])
    admissions_header_subtitle = TextAreaField("Admissions - Sous-titre de l'en-tête", validators=[DataRequired()])
    admissions_process_title = StringField("Admissions - Titre du processus", validators=[DataRequired()])

    admissions_phase1_title = StringField("Admissions - Titre Phase 1", validators=[DataRequired()])
    admissions_phase1_period = StringField("Admissions - Période Phase 1", validators=[DataRequired()])
    admissions_phase1_details = TextAreaField("Admissions - Détails Phase 1 (format JSON)", validators=[DataRequired()])

    admissions_phase2_title = StringField("Admissions - Titre Phase 2", validators=[DataRequired()])
    admissions_phase2_period = StringField("Admissions - Période Phase 2", validators=[DataRequired()])
    admissions_phase2_details = TextAreaField("Admissions - Détails Phase 2 (format JSON)", validators=[DataRequired()])

    admissions_phase3_title = StringField("Admissions - Titre Phase 3", validators=[DataRequired()])
    admissions_phase3_period = StringField("Admissions - Période Phase 3", validators=[DataRequired()])
    admissions_phase3_details = TextAreaField("Admissions - Détails Phase 3 (format JSON)", validators=[DataRequired()])

    admissions_phase4_title = StringField("Admissions - Titre Phase 4", validators=[DataRequired()])
    admissions_phase4_period = StringField("Admissions - Période Phase 4", validators=[DataRequired()])
    admissions_phase4_details = TextAreaField("Admissions - Détails Phase 4 (format JSON)", validators=[DataRequired()])

    admissions_requirements_title = StringField("Admissions - Titre des Prérequis", validators=[DataRequired()])
    admissions_training_title = StringField("Admissions - Outils Formation - Titre")
    admissions_training_cards = TextAreaField("Admissions - Outils Formation - Cartes (JSON)")
    admissions_training_button_text = StringField("Admissions - Outils Formation - Bouton (texte)")
    admissions_training_button_link = StringField("Admissions - Outils Formation - Bouton (lien)")

    # 5. CARRIÈRES
    career_hero_title       = StringField("Carrières - Hero - Titre")
    career_hero_subtitle    = TextAreaField("Carrières - Hero - Sous-titre")
    career_jobs_title       = StringField("Carrières - Métiers - Titre")
    career_jobs_json        = TextAreaField("Carrières - Métiers (JSON)")
    career_stats_title      = StringField("Carrières - Stats - Titre")
    career_stats_json       = TextAreaField("Carrières - Stats (JSON)")
    career_video_title      = StringField("Carrières - Vidéo - Titre")
    career_video_url        = StringField("Carrières - Vidéo - URL YouTube")
    career_cta_title        = StringField("Carrières - CTA - Titre")
    career_cta_description  = TextAreaField("Carrières - CTA - Description")
    career_cta_button_text  = StringField("Carrières - CTA - Bouton (texte)")
    career_cta_button_link  = StringField("Carrières - CTA - Bouton (lien)")

    # 6. CONTACT
    contact_hero_title      = StringField("Contact - Hero - Titre")
    contact_hero_subtitle   = TextAreaField("Contact - Hero - Sous-titre")
    contact_form_title      = StringField("Contact - Formulaire - Titre")
    contact_info_title      = StringField("Contact - Informations - Titre")
    contact_info_json       = TextAreaField("Contact - Informations (JSON)")
    contact_map_title       = StringField("Contact - Map - Titre")
    contact_map_address     = TextAreaField("Contact - Map - Adresse")
    contact_map_iframe      = TextAreaField("Contact - Map - iFrame")

    # Bouton de soumission
    submit = SubmitField("Enregistrer")


# --- 2. FORMULAIRE DE CONNEXION (Modifié : plus d'email) ---
class LoginForm(FlaskForm):
    password = PasswordField('Mot de passe', validators=[DataRequired(), Length(min=6)])
    submit = SubmitField('Connexion')


# --- 3. FORMULAIRES DE GESTION DES LOGOS PARTENAIRES ---
class PartnerLogoUploadForm(FlaskForm):
    alt = StringField("Texte alternatif (alt)", validators=[DataRequired()])
    file = FileField("Fichier du logo", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'], "Formats autorisés : png, jpg, jpeg, gif"),
        DataRequired()
    ])
    submit = SubmitField("Ajouter le logo")


class PartnerLogoEditForm(FlaskForm):
    alt = StringField("Texte alternatif (alt)", validators=[DataRequired()])
    file = FileField("Nouveau fichier (optionnel)", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'], "Formats autorisés : png, jpg, jpeg, gif")
    ])
    submit = SubmitField("Enregistrer les modifications")


# --- 5. GESTION DES PROJETS (CRUD) ---
class ProjectForm(FlaskForm):
    """
    Formulaire pour créer ou éditer un projet universitaire.
    """
    year = StringField("Année", validators=[DataRequired()])
    title = StringField("Titre du Projet", validators=[DataRequired()])
    description = TextAreaField("Description", validators=[DataRequired()])
    link = StringField("Lien (optionnel)")

    # Jusqu'à 5 images
    image1 = FileField("Image 1", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'])
    ])
    image2 = FileField("Image 2", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'])
    ])
    image3 = FileField("Image 3", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'])
    ])
    image4 = FileField("Image 4", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'])
    ])
    image5 = FileField("Image 5", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'])
    ])

    # Étudiant 1
    student1_name = StringField("Nom de l'étudiant 1")
    student1_photo = FileField("Photo de profil étudiant 1", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'])
    ])
    student1_linkedin = StringField("Lien LinkedIn étudiant 1")

    # Étudiant 2
    student2_name = StringField("Nom de l'étudiant 2")
    student2_photo = FileField("Photo de profil étudiant 2", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'])
    ])
    student2_linkedin = StringField("Lien LinkedIn étudiant 2")

    # Étudiant 3
    student3_name = StringField("Nom de l'étudiant 3")
    student3_photo = FileField("Photo de profil étudiant 3", validators=[
        FileAllowed(['png', 'jpg', 'jpeg', 'gif'])
    ])
    student3_linkedin = StringField("Lien LinkedIn étudiant 3")

    submit = SubmitField("Enregistrer")
