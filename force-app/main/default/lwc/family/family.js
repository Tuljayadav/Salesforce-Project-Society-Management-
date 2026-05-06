import { LightningElement, track, wire } from 'lwc';
import searchFamily from '@salesforce/apex/Familyservice.searchFamily';
import createFamilyWithHead from '@salesforce/apex/Familyservice.createFamilyWithHead';
import deleteFamily from '@salesforce/apex/Familyservice.deleteFamily';
import updateFamily from '@salesforce/apex/Familyservice.updateFamily';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class FamilyDashboard extends LightningElement {

    @track families = [];
    searchKey = '';

    showModal = false;
    showEditModal = false;
    isLoading = false;

    familyName;
    selectedFamilyId;
    showMembers = false;

    showDeleteModal = false;
    deleteRecordId;

    wiredResult;

    // ✅ COLUMNS (View button + Dropdown BOTH)
    columns = [
        { label: 'Family Name', fieldName: 'Name' },
        { label: 'Head of Family', fieldName: 'headName' },

        // 🔥 View Members button (DO NOT REMOVE)
        {
            label: 'View Members',
            type: 'button',
            typeAttributes: {
                label: 'View Members',
                name: 'view_members',
                variant: 'brand',
                iconName: 'utility:new_window', 
                iconPosition: 'left'
            }
        },

        // 🔥 Dropdown (Edit/Delete)
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'Edit', name: 'edit' },
                    { label: 'Delete', name: 'delete' }
                ]
            }
        }
    ];

    // ✅ DATA LOAD
    @wire(searchFamily, { searchKey: '$searchKey' })
    wiredFamilies(result) {
        this.wiredResult = result;

        if (result.data) {
            this.families = result.data.map(fam => {
                return {
                    ...fam,
                    headName: fam.Head_of_Family__r
                        ? fam.Head_of_Family__r.Name
                        : 'N/A'
                };
            });
        } else if (result.error) {
            console.error(result.error);
        }
    }

    // ✅ SEARCH
    handleSearch(event) {
        this.searchKey = event.target.value;
    }

    // ✅ ALL BUTTON HANDLING
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        console.log('ACTION:', actionName);
        console.log('ROW ID:', row.Id);


        // 🔥 VIEW MEMBERS (IMPORTANT)
        if (actionName === 'view_members') {
            this.selectedFamilyId = row.Id;
            this.showMembers = true;
        }

        // 🔥 DELETE
        else if (actionName === 'delete') {
            this.deleteRecordId = row.Id;
            this.familyName = row.Name;
            this.showDeleteModal = true;
        }

        // 🔥 EDIT
        else if (actionName === 'edit') {
            this.selectedFamilyId = row.Id;
            this.familyName = row.Name; // prefill
            this.showEditModal = true;
        }
    }

    // 🔥 DELETE CONFIRM
    confirmDelete() {
        deleteFamily({ familyId: this.deleteRecordId })
        .then(() => {
            this.showToast('Success', 'Family deleted', 'success');
            this.showDeleteModal = false;
            return refreshApex(this.wiredResult);
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', 'Error deleting family', 'error');
        });
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
    }

    // ✅ MODALS
    openModal() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    closeEditModal() {
        this.showEditModal = false;
    }

    handleFamilyName(e) {
        this.familyName = e.target.value;
    }

    // ✅ CREATE FAMILY
    saveFamily() {
        if (!this.familyName) {
            this.showToast('Error', 'Family Name is required', 'error');
            return;
        }

        createFamilyWithHead({ familyName: this.familyName })
        .then(() => {
            this.showToast('Success', 'Family Created', 'success');
            this.showModal = false;
            this.familyName = '';
            return refreshApex(this.wiredResult);
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', 'Error creating family', 'error');
        });
    }

    // ✅ UPDATE FAMILY
    updateFamilyHandler() {
        updateFamily({
            familyId: this.selectedFamilyId,
            familyName: this.familyName
        })
        .then(() => {
            this.showToast('Success', 'Family updated', 'success');
            this.showEditModal = false;
            return refreshApex(this.wiredResult);
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', 'Error updating family', 'error');
        });
    }

    // ✅ BACK
    handleBack() {
        this.showMembers = false;
        this.selectedFamilyId = null;
    }

    // ✅ TOAST
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}