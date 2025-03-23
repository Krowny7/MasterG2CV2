"""
==========================================================================
TABLE DES MATIÈRES - data_manager.py
==========================================================================
I. CONFIGURATION
   - Définition de l'URL de Firebase et du chemin de la racine du contenu

II. FONCTIONS DE GESTION DU CONTENU
   1. get_homepage_content() : Récupère le contenu de la page d’accueil
   2. update_homepage_content(data) : Met à jour le contenu de la page d’accueil
==========================================================================
"""

import requests

# ==========================================================================
# I. CONFIGURATION
# ==========================================================================
FIREBASE_URL = 'https://master-g2c-default-rtdb.europe-west1.firebasedatabase.app/'
HOMEPAGE_CONTENT_PATH = '.json'  # Chemin vers la racine du contenu dans Firebase

# ==========================================================================
# II. FONCTIONS DE GESTION DU CONTENU
# ==========================================================================

def get_homepage_content():
    """
    Récupère le contenu de la page d’accueil depuis Firebase.
    
    Retourne :
      - Un dictionnaire contenant le contenu, ou
      - Un dictionnaire vide en cas d'erreur.
    """
    try:
        url = FIREBASE_URL + HOMEPAGE_CONTENT_PATH
        response = requests.get(url)
        if response.ok:
            return response.json() or {}
        else:
            print("Erreur HTTP lors de la récupération:", response.status_code, response.text)
    except Exception as e:
        print("Erreur lors de la récupération du contenu :", e)
    return {}

def update_homepage_content(data):
    """
    Met à jour le contenu de la page d’accueil dans Firebase.

    Paramètre :
      - data : dictionnaire contenant le nouveau contenu.

    Retourne :
      - True si la mise à jour a réussi,
      - False en cas d'erreur.
    """
    try:
        url = FIREBASE_URL + HOMEPAGE_CONTENT_PATH
        response = requests.patch(url, json=data)
        return response.ok
    except Exception as e:
        print("Erreur lors de la mise à jour du contenu :", e)
        return False
