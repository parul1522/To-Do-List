"""Reusable input validators."""


def validate_password_strength(password: str) -> str:
    """Require a mix of letters and digits and reject whitespace-only padding.

    Deliberately modest: length is the strongest factor, and NIST 800-63B
    discourages heavy composition rules.
    """
    if password.strip() != password:
        raise ValueError("Password must not start or end with whitespace")
    if not any(ch.isalpha() for ch in password):
        raise ValueError("Password must contain at least one letter")
    if not any(ch.isdigit() for ch in password):
        raise ValueError("Password must contain at least one number")
    return password


def normalize_email(email: str) -> str:
    return email.strip().lower()
