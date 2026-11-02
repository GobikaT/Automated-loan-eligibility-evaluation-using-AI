"""
Authentication routes.

IMPORTANT (Section 5 of the spec):
  * There is ONLY a public registration endpoint for APPLICANTS.
  * Branch Managers and Admins can never self-register -- their accounts are
    created exclusively through the Admin module (see routes/admin.py).
  * A single /login endpoint serves all three roles; the frontend simply
    points its three distinct login pages (Applicant/Manager/Admin) at the
    same endpoint. The JWT's `role` claim -- not the page the user logged
    in from -- is what backend authorization relies on.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.party import Applicant, BranchManager, Admin
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.auth import (
    ApplicantRegisterRequest,
    LoginRequest,
    TokenResponse,
    ChangePasswordRequest,
    UpdateNameRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_user_display_name(user: User) -> str:
    """Helper to get user's display full name across Applicant, Manager, Admin."""
    if user.role == UserRole.APPLICANT and user.applicant_profile:
        return user.applicant_profile.full_name
    elif user.role == UserRole.MANAGER and user.manager_profile:
        return user.manager_profile.full_name
    elif user.role == UserRole.ADMIN and user.admin_profile:
        return user.admin_profile.full_name
    return user.email.split("@")[0] if user.email else "User"


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_applicant(payload: ApplicantRegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    user = User(
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.APPLICANT,
        is_active=True,
    )
    db.add(user)
    db.flush()

    applicant = Applicant(
        user_id=user.id,
        full_name=payload.full_name,
        date_of_birth=payload.date_of_birth,
        address=payload.address,
    )
    db.add(applicant)
    db.commit()

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(
        access_token=token,
        role=user.role.value,
        id=user.id,
        email=user.email,
        full_name=applicant.full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(
        access_token=token,
        role=user.role.value,
        id=user.id,
        email=user.email,
        full_name=get_user_display_name(user),
    )


@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return authenticated user information across all roles."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role.value,
        "full_name": get_user_display_name(current_user),
    }


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Securely update authenticated user's password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match.",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password.",
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/update-name")
def update_user_name(
    payload: UpdateNameRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the authenticated user's display/full name across roles.
    This updates the name displayed after 'Welcome, ...!' on the dashboard.
    """
    new_name = payload.full_name.strip()
    if not new_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User name cannot be empty.",
        )

    if current_user.role == UserRole.APPLICANT:
        if current_user.applicant_profile:
            current_user.applicant_profile.full_name = new_name
        else:
            db.add(Applicant(user_id=current_user.id, full_name=new_name))
    elif current_user.role == UserRole.MANAGER:
        if current_user.manager_profile:
            current_user.manager_profile.full_name = new_name
    elif current_user.role == UserRole.ADMIN:
        if current_user.admin_profile:
            current_user.admin_profile.full_name = new_name
        else:
            db.add(Admin(user_id=current_user.id, full_name=new_name))

    db.commit()

    return {
        "message": "User name updated successfully.",
        "full_name": new_name,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value,
            "full_name": new_name,
        },
    }
