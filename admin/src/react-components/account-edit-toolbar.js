import React, { useState } from "react";
import { Toolbar, SaveButton } from "react-admin";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { Dialog, DialogContent, DialogContentText, DialogActions } from "@material-ui/core";

const accountEditToolbarStyles = {
  spaceBetween: { justifyContent: "space-between" },
  dialogActions: { padding: "0 5px" }
};

const deleteStates = {
  confirming: "confirming",
  deleting: "deleting",
  succeeded: "succeeded",
  failed: "failed"
};

export const AccountEditToolbar = withStyles(accountEditToolbarStyles)(props => {
  const { classes, ...other } = props;
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [deleteState, setDeleteState] = useState(deleteStates.confirming);

  const onDeleteAccount = async accountId => {
    setDeleteState(deleteStates.deleting);

    try {
      const resp = await fetch(`/api/v1/accounts/${accountId}`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          authorization: `bearer ${window.APP.store.state.credentials.token}`
        }
      });

      setDeleteState(resp.ok ? deleteStates.succeeded : deleteStates.failed);
    } catch {
      setDeleteState(deleteStates.failed);
    }
  };

  return (
    <Toolbar {...other} className={`${classes.spaceBetween}`}>
      <SaveButton />

      {!props.record.is_admin && (
        <Button label="Delete" onClick={() => setOpenConfirmationDialog(true)} variant="outlined">
          Delete
        </Button>
      )}

      <Dialog open={openConfirmationDialog}>
        <DialogContent>
          <DialogContentText>
            {deleteState === deleteStates.confirming && (
              <>
                Are you sure you want to delete account {props.id}?<br />
                <br />
                <b>WARNING!</b> This account will be permanently deleted, including all its scenes, assets, avatars,
                rooms and files. <b>This cannot be undone.</b>
              </>
            )}

            {deleteState === deleteStates.deleting && <>Deleting account {props.id}...</>}

            {deleteState === deleteStates.succeeded && <>Successfully deleted account {props.id}.</>}

            {deleteState === deleteStates.failed && <>Failed to deleted account {props.id}.</>}
          </DialogContentText>
        </DialogContent>

        <DialogActions className={`${classes.dialogActions} ${classes.spaceBetween}`}>
          {[deleteStates.succeeded, deleteStates.failed].includes(deleteState) && (
            <Button
              variant="outlined"
              onClick={() => {
                setOpenConfirmationDialog(false);
                if (deleteState === deleteStates.succeeded) {
                  props.history.push("/accounts");
                }
              }}
            >
              Okay
            </Button>
          )}

          {deleteState === deleteStates.confirming && (
            <>
              <Button variant="outlined" onClick={() => onDeleteAccount(props.id)}>
                Yes, permanently delete this account
              </Button>
              <Button variant="outlined" onClick={() => setOpenConfirmationDialog(false)}>
                Cancel
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Toolbar>
  );
});
